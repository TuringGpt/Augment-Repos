import { create } from 'zustand'
import { notificationService } from '@services/api'
import type { Notification } from '@features/notifications/types'
import { useUIStore } from '@store/uiStore'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  total: number
  page: number
  limit: number
  totalPages: number
  isLoading: boolean
  error: string | null
  unreadCountError: string | null // Separate error state for unread count polling
  markingAsRead: Set<string> // Track which notifications are being marked as read
  deletingNotifications: Set<string> // Track which notifications are being deleted

  // Separate state for NotificationList dropdown menu
  // This prevents the menu from interfering with NotificationsPage state
  menuNotifications: Notification[]
  menuIsLoading: boolean
  menuError: string | null

  // Selected notification for details drawer
  selectedNotification: Notification | null

  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>
  fetchNotificationsWithoutPaginationUpdate: (page: number, limit: number) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (notificationId: string, options?: { fromMenu?: boolean }) => Promise<void>
  deleteNotification: (notificationId: string, options?: { fromMenu?: boolean }) => Promise<void>
  clearNotifications: () => void
  setPage: (page: number) => void
  setSelectedNotification: (notification: Notification | null) => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

// Separate request counter for fetchNotificationsWithoutPaginationUpdate
// Prevents it from interfering with fetchNotifications and causing page/notifications out of sync
let fetchWithoutPaginationUpdateRequestCounter = 0

// Request counter for unread count fetches
// Prevents concurrent calls from racing and stale responses from overwriting newer count
let fetchUnreadCountRequestCounter = 0

// Track last error state to prevent log spam during polling
// Only log when transitioning from success to error or when error message changes
let lastUnreadCountError: string | null = null

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  isLoading: false,
  error: null,
  unreadCountError: null,
  markingAsRead: new Set<string>(),
  deletingNotifications: new Set<string>(),

  // Menu-specific state
  menuNotifications: [],
  menuIsLoading: false,
  menuError: null,

  // Selected notification for details drawer
  selectedNotification: null,

  fetchNotifications: async (page?: number, limit?: number) => {
    const state = get()
    const currentPage = page ?? state.page
    const currentLimit = limit ?? state.limit

    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    set({ isLoading: true, error: null })
    try {
      const response = await notificationService.getNotifications(currentPage, currentLimit)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === fetchRequestCounter) {
        set({
          notifications: response.notifications,
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
          isLoading: false,
        })
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch notifications',
          isLoading: false,
        })
      }
    }
  },

  fetchNotificationsWithoutPaginationUpdate: async (page: number, limit: number) => {
    // Increment counter and capture the current request ID
    // Use separate counter to avoid invalidating fetchNotifications() calls
    fetchWithoutPaginationUpdateRequestCounter += 1
    const requestId = fetchWithoutPaginationUpdateRequestCounter

    // Use menu-specific state to avoid interfering with NotificationsPage
    set({ menuIsLoading: true, menuError: null })
    try {
      const response = await notificationService.getNotifications(page, limit)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === fetchWithoutPaginationUpdateRequestCounter) {
        set({
          menuNotifications: response.notifications,
          // DO NOT update shared state (notifications, total, totalPages, page, limit, isLoading, error)
          // to avoid interfering with NotificationsPage
          menuIsLoading: false,
        })
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      if (requestId === fetchWithoutPaginationUpdateRequestCounter) {
        set({
          menuError: error instanceof Error ? error.message : 'Failed to fetch notifications',
          menuIsLoading: false,
        })
      }
    }
  },

  fetchUnreadCount: async () => {
    // Increment counter and capture the current request ID
    fetchUnreadCountRequestCounter += 1
    const requestId = fetchUnreadCountRequestCounter

    try {
      const count = await notificationService.getUnreadCount()

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === fetchUnreadCountRequestCounter) {
        set({ unreadCount: count, unreadCountError: null })
        // Clear the last error state when successfully fetching
        lastUnreadCountError = null
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      // Use separate unreadCountError to avoid affecting NotificationList error display
      if (requestId === fetchUnreadCountRequestCounter) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch unread count'
        set({
          unreadCountError: errorMessage,
        })

        // Only log when error state changes to prevent spam during polling
        // This avoids flooding logs during outages while still capturing state transitions
        if (lastUnreadCountError !== errorMessage) {
          console.error('Failed to fetch unread count:', error)
          lastUnreadCountError = errorMessage
        }
      }
    }
  },

  markAsRead: async (notificationId: string, options?: { fromMenu?: boolean }) => {
    const initialState = get()

    // Don't mark if already being marked
    if (initialState.markingAsRead.has(notificationId)) {
      return
    }

    // Find the notification in either notifications or menuNotifications array
    // This ensures we can mark notifications from both the NotificationsPage and NotificationList
    const notification = initialState.notifications.find((n) => n.id === notificationId)
    const menuNotification = initialState.menuNotifications.find((n) => n.id === notificationId)

    // If not found in either array, nothing to do
    if (!notification && !menuNotification) {
      return
    }

    // Only return early if the notification is already read in ALL places where it exists
    // This prevents inconsistency between the two arrays
    const isReadInNotifications = notification ? notification.isRead : true
    const isReadInMenuNotifications = menuNotification ? menuNotification.isRead : true

    if (isReadInNotifications && isReadInMenuNotifications) {
      return
    }

    // Determine if this is a menu-context action based on options
    // This allows us to set the appropriate error field on failure
    const fromMenu = options?.fromMenu ?? false

    // Check if the notification is currently unread in at least one location
    // Only decrement unread count if it's actually contributing to the unread total
    const isCurrentlyUnread = !isReadInNotifications || !isReadInMenuNotifications

    // Add to marking set
    const newMarkingAsRead = new Set(initialState.markingAsRead)
    newMarkingAsRead.add(notificationId)

    // OPTIMISTIC UPDATE: Update local state immediately before API call
    // Update both notifications and menuNotifications arrays
    const optimisticNotifications = initialState.notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    )
    const optimisticMenuNotifications = initialState.menuNotifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    )

    // Update selectedNotification if it matches the notification being marked as read
    // This ensures the details drawer shows the latest state
    const optimisticSelectedNotification =
      initialState.selectedNotification?.id === notificationId
        ? { ...initialState.selectedNotification, isRead: true }
        : initialState.selectedNotification

    // Decrement total unread count by 1 only if the notification was actually unread
    // This prevents undercounting when one list is stale
    const optimisticUnreadCount = isCurrentlyUnread
      ? Math.max(0, initialState.unreadCount - 1)
      : initialState.unreadCount

    // Track how much we actually decremented for rollback
    // This allows us to revert only our own change while preserving
    // any other updates that happened during the in-flight API call
    const actualDecrement = initialState.unreadCount - optimisticUnreadCount

    // Store the original isRead state for rollback
    // This ensures we revert to the pre-optimistic state per list
    // rather than always setting isRead: false on rollback
    const originalIsReadInNotifications = isReadInNotifications
    const originalIsReadInMenuNotifications = isReadInMenuNotifications

    // Store the original isRead state of selectedNotification separately
    // Only snapshot when selectedNotification.id === notificationId to prevent
    // rollback from incorrectly applying an isRead value from an unrelated notification
    const originalSelectedIsRead =
      initialState.selectedNotification?.id === notificationId
        ? initialState.selectedNotification.isRead
        : undefined

    // Invalidate any in-flight fetchUnreadCount() requests to prevent them
    // from overwriting this optimistic update with stale server data
    fetchUnreadCountRequestCounter += 1

    // Only invalidate fetchNotifications() when called from NotificationsPage (not from menu)
    // This prevents menu-driven markAsRead from canceling unrelated page pagination requests
    // which would leave page/notifications out of sync with no loading indicator
    if (!fromMenu) {
      fetchRequestCounter += 1
    }

    // Invalidate any in-flight fetchNotificationsWithoutPaginationUpdate() requests
    // to prevent stale menu fetch responses from reverting the optimistic read state
    fetchWithoutPaginationUpdateRequestCounter += 1

    set({
      notifications: optimisticNotifications,
      menuNotifications: optimisticMenuNotifications,
      selectedNotification: optimisticSelectedNotification,
      unreadCount: optimisticUnreadCount,
      markingAsRead: newMarkingAsRead,
      // Only clear isLoading when we actually invalidated the request (not from menu)
      // This prevents removing the loading indicator from an ongoing page fetch
      isLoading: fromMenu ? initialState.isLoading : false,
      menuIsLoading: false,
    })

    try {
      // Call API to mark as read
      await notificationService.markAsRead(notificationId)

      // Read latest state after await to avoid stale data and race conditions
      const latestState = get()

      // Remove from marking set using latest state
      const finalMarkingAsRead = new Set(latestState.markingAsRead)
      finalMarkingAsRead.delete(notificationId)

      set({
        markingAsRead: finalMarkingAsRead,
      })
    } catch (error) {
      // ROLLBACK: Revert the optimistic update on error
      // Read latest state in catch block to avoid stale data
      const latestState = get()

      // Check if the notification was deleted while markAsRead was in-flight
      // If deleted, skip rollback to prevent race where we increment unreadCount for a deleted notification
      const wasDeleted = latestState.deletingNotifications.has(notificationId) ||
        (!latestState.notifications.some((n) => n.id === notificationId) &&
         !latestState.menuNotifications.some((n) => n.id === notificationId) &&
         latestState.selectedNotification?.id !== notificationId)

      // If notification was deleted, just clean up the marking set and return
      // Don't revert unreadCount or notification state since delete already handled it
      if (wasDeleted) {
        const finalMarkingAsRead = new Set(latestState.markingAsRead)
        finalMarkingAsRead.delete(notificationId)
        set({ markingAsRead: finalMarkingAsRead })
        // Don't re-throw error since the notification is gone anyway
        return
      }

      // Revert notification back to original isRead state in both arrays
      // Use the pre-optimistic state for each list to avoid incorrectly
      // flipping a notification that was already read in one list
      const revertedNotifications = latestState.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: originalIsReadInNotifications } : n
      )
      const revertedMenuNotifications = latestState.menuNotifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: originalIsReadInMenuNotifications } : n
      )

      // Revert selectedNotification's isRead state if it matches the notification being reverted
      // Only revert the isRead field to avoid overwriting other changes (e.g., user selected a different notification)
      // If we snapshotted selectedNotification's isRead state, use it; otherwise fall back to the
      // original state from the list to handle the race condition where user selects this notification
      // after the request started (but before it failed)
      let revertedSelectedNotification = latestState.selectedNotification
      if (latestState.selectedNotification?.id === notificationId) {
        const fallbackIsRead = originalSelectedIsRead !== undefined
          ? originalSelectedIsRead
          : (originalIsReadInNotifications ?? originalIsReadInMenuNotifications)
        revertedSelectedNotification = {
          ...latestState.selectedNotification,
          isRead: fallbackIsRead,
        }
      }

      // Revert unread count by adding back the exact amount we decremented
      // This preserves any other updates (e.g., from fetchUnreadCount() or other
      // markAsRead() calls) that happened while this API call was in-flight
      const revertedUnreadCount = latestState.unreadCount + actualDecrement

      // Remove from marking set on error using latest state
      const finalMarkingAsRead = new Set(latestState.markingAsRead)
      finalMarkingAsRead.delete(notificationId)

      // Set error in the appropriate scope based on context
      // Menu errors go to menuError to preserve isolation from NotificationsPage
      // Page errors go to the shared error field
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read'

      set({
        notifications: revertedNotifications,
        menuNotifications: revertedMenuNotifications,
        selectedNotification: revertedSelectedNotification,
        unreadCount: revertedUnreadCount,
        markingAsRead: finalMarkingAsRead,
        ...(fromMenu ? { menuError: errorMessage } : { error: errorMessage }),
      })

      // Re-throw to allow UI to handle error
      throw error
    }
  },

  deleteNotification: async (notificationId: string, options?: { fromMenu?: boolean }) => {
    const initialState = get()

    // Don't delete if already being deleted
    if (initialState.deletingNotifications.has(notificationId)) {
      return
    }

    // Find the notification in either notifications or menuNotifications array
    const notification = initialState.notifications.find((n) => n.id === notificationId)
    const menuNotification = initialState.menuNotifications.find((n) => n.id === notificationId)

    // Check if the notification is the currently selected one
    const isSelectedNotification = initialState.selectedNotification?.id === notificationId

    // If not found in either array AND not the selected notification, nothing to do
    if (!notification && !menuNotification && !isSelectedNotification) {
      return
    }

    // Determine if this is a menu-context action based on options
    const fromMenu = options?.fromMenu ?? false

    // Check if the notification is unread in at least one location
    // We need to decrement unread count if it's unread anywhere
    const isUnreadInNotifications = notification ? !notification.isRead : false
    const isUnreadInMenuNotifications = menuNotification ? !menuNotification.isRead : false
    const isUnreadInSelectedNotification =
      isSelectedNotification && initialState.selectedNotification ? !initialState.selectedNotification.isRead : false
    const isCurrentlyUnread = isUnreadInNotifications || isUnreadInMenuNotifications || isUnreadInSelectedNotification

    // Add to deleting set
    const newDeletingNotifications = new Set(initialState.deletingNotifications)
    newDeletingNotifications.add(notificationId)

    // Clear any in-flight markAsRead operations for this notification
    // This prevents a race where markAsRead rollback increments unreadCount after deletion
    const newMarkingAsRead = new Set(initialState.markingAsRead)
    newMarkingAsRead.delete(notificationId)

    // OPTIMISTIC UPDATE: Remove notification from both arrays immediately
    const optimisticNotifications = initialState.notifications.filter((n) => n.id !== notificationId)
    const optimisticMenuNotifications = initialState.menuNotifications.filter(
      (n) => n.id !== notificationId
    )

    // Close details drawer if the deleted notification is currently selected
    const shouldCloseDrawer = initialState.selectedNotification?.id === notificationId
    const optimisticSelectedNotification = shouldCloseDrawer
      ? null
      : initialState.selectedNotification

    // Close the drawer in uiStore if we're clearing the selected notification
    if (shouldCloseDrawer) {
      useUIStore.getState().setNotificationDetailsDrawerOpen(false)
    }

    // Decrement total count and unread count if the notification was unread
    const optimisticTotal = Math.max(0, initialState.total - 1)
    const optimisticUnreadCount = isCurrentlyUnread
      ? Math.max(0, initialState.unreadCount - 1)
      : initialState.unreadCount

    // Recalculate totalPages based on optimistic total to keep pagination consistent
    const optimisticTotalPages = Math.ceil(optimisticTotal / initialState.limit)

    // Clamp page to valid range to prevent page > totalPages
    // This is critical when deleting notifications on the last page
    const optimisticPage = Math.min(initialState.page, Math.max(1, optimisticTotalPages))

    // Track the actual decrements for rollback
    const totalDecrement = initialState.total - optimisticTotal
    const unreadDecrement = initialState.unreadCount - optimisticUnreadCount

    // Invalidate in-flight requests to prevent stale data from overwriting optimistic updates
    fetchUnreadCountRequestCounter += 1

    // Only invalidate fetchNotifications() when called from NotificationsPage (not from menu)
    // This prevents menu-driven deleteNotification from canceling unrelated page pagination requests
    // which would leave page/notifications out of sync with no loading indicator
    if (!fromMenu) {
      fetchRequestCounter += 1
    }

    fetchWithoutPaginationUpdateRequestCounter += 1

    set({
      notifications: optimisticNotifications,
      menuNotifications: optimisticMenuNotifications,
      selectedNotification: optimisticSelectedNotification,
      total: optimisticTotal,
      totalPages: optimisticTotalPages,
      page: optimisticPage,
      unreadCount: optimisticUnreadCount,
      deletingNotifications: newDeletingNotifications,
      markingAsRead: newMarkingAsRead, // Clear in-flight markAsRead to prevent race
      isLoading: fromMenu ? initialState.isLoading : false,
      menuIsLoading: false,
      // Clear error state on optimistic update to prevent stale errors from persisting
      ...(fromMenu ? { menuError: null } : { error: null }),
    })

    try {
      // Call API to delete notification
      await notificationService.deleteNotification(notificationId)

      // Read latest state after await
      const latestState = get()

      // Remove from deleting set using latest state
      const finalDeletingNotifications = new Set(latestState.deletingNotifications)
      finalDeletingNotifications.delete(notificationId)

      set({
        deletingNotifications: finalDeletingNotifications,
        // Clear error state on success to prevent stale errors from persisting
        ...(fromMenu ? { menuError: null } : { error: null }),
      })
    } catch (error) {
      // ROLLBACK: Revert the optimistic update on error
      const latestState = get()

      // Add notification back to both arrays if it was present there originally
      // Check for duplicates to prevent issues if a fetch repopulated the item during the in-flight delete
      const notificationAlreadyExists = latestState.notifications.some((n) => n.id === notificationId)
      const revertedNotifications = notification
        ? notificationAlreadyExists
          ? latestState.notifications // Already exists, don't add duplicate
          : [...latestState.notifications, notification].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        : latestState.notifications

      const menuNotificationAlreadyExists = latestState.menuNotifications.some((n) => n.id === notificationId)
      const revertedMenuNotifications = menuNotification
        ? menuNotificationAlreadyExists
          ? latestState.menuNotifications // Already exists, don't add duplicate
          : [...latestState.menuNotifications, menuNotification].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        : latestState.menuNotifications

      // Revert total and unread count only if we're actually adding the notification back
      // If the notification already exists in latestState (from an in-flight fetch), don't adjust counts
      // to prevent over-correction that would cause counts to drift upward
      const wasNotificationAddedBack = (notification && !notificationAlreadyExists) || (menuNotification && !menuNotificationAlreadyExists)
      const revertedTotal = wasNotificationAddedBack ? latestState.total + totalDecrement : latestState.total
      const revertedUnreadCount = wasNotificationAddedBack ? latestState.unreadCount + unreadDecrement : latestState.unreadCount

      // Recalculate totalPages based on reverted total to keep pagination consistent
      const revertedTotalPages = Math.ceil(revertedTotal / latestState.limit)

      // Clamp page to valid range after rollback
      const revertedPage = Math.min(latestState.page, Math.max(1, revertedTotalPages))

      // Restore selectedNotification only if:
      // 1. The deleted notification was the selected one (initialState.selectedNotification?.id === notificationId)
      // 2. AND the user hasn't selected a new notification in the meantime (latestState.selectedNotification === null)
      // This prevents overwriting a newer user selection made after the optimistic close
      const revertedSelectedNotification =
        initialState.selectedNotification?.id === notificationId && latestState.selectedNotification === null
          ? initialState.selectedNotification
          : latestState.selectedNotification

      // Remove from deleting set
      const finalDeletingNotifications = new Set(latestState.deletingNotifications)
      finalDeletingNotifications.delete(notificationId)

      // Set error in the appropriate scope
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete notification'

      set({
        notifications: revertedNotifications,
        menuNotifications: revertedMenuNotifications,
        selectedNotification: revertedSelectedNotification,
        total: revertedTotal,
        totalPages: revertedTotalPages,
        page: revertedPage,
        unreadCount: revertedUnreadCount,
        deletingNotifications: finalDeletingNotifications,
        ...(fromMenu ? { menuError: errorMessage } : { error: errorMessage }),
      })

      // Re-open the drawer if we closed it during the optimistic update
      // AND we're actually restoring the selectedNotification
      if (shouldCloseDrawer && revertedSelectedNotification?.id === notificationId) {
        useUIStore.getState().setNotificationDetailsDrawerOpen(true)
      }

      // Re-throw to allow UI to handle error
      throw error
    }
  },

  clearNotifications: () => {
    // Increment counters to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchRequestCounter += 1
    fetchWithoutPaginationUpdateRequestCounter += 1
    fetchUnreadCountRequestCounter += 1

    // Reset error tracking to ensure errors are logged correctly in new sessions
    // This prevents stale error state from suppressing logs after logout/login
    lastUnreadCountError = null

    set({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      // Clear loading states to prevent them from being stranded at true
      // when in-flight requests are invalidated by the counter increments above
      isLoading: false,
      error: null,
      unreadCountError: null,
      markingAsRead: new Set<string>(),
      deletingNotifications: new Set<string>(),
      // Also clear menu-specific state
      menuNotifications: [],
      menuIsLoading: false,
      menuError: null,
      // Clear selected notification to prevent stale details after logout/clear
      selectedNotification: null,
    })
  },

  setPage: (page: number) => {
    set({ page })
    get().fetchNotifications(page, get().limit)
  },

  setSelectedNotification: (notification: Notification | null) => {
    set({ selectedNotification: notification })
  },
}))
