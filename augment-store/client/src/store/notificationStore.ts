import { create } from 'zustand'
import { notificationService } from '@services/api'
import type { Notification } from '@features/notifications/types'

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

  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>
  fetchNotificationsWithoutPaginationUpdate: (page: number, limit: number) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  clearNotifications: () => void
  setPage: (page: number) => void
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

    set({ isLoading: true, error: null })
    try {
      const response = await notificationService.getNotifications(page, limit)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === fetchWithoutPaginationUpdateRequestCounter) {
        set({
          notifications: response.notifications,
          total: response.total,
          // DO NOT update page/limit to avoid interfering with NotificationsPage pagination
          totalPages: response.totalPages,
          isLoading: false,
        })
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      if (requestId === fetchWithoutPaginationUpdateRequestCounter) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch notifications',
          isLoading: false,
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
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      // Use separate unreadCountError to avoid affecting NotificationList error display
      if (requestId === fetchUnreadCountRequestCounter) {
        set({
          unreadCountError: error instanceof Error ? error.message : 'Failed to fetch unread count',
        })
      }
      // Silently log the error - don't disrupt the UI for background polling failures
      console.error('Failed to fetch unread count:', error)
    }
  },

  markAsRead: async (notificationId: string) => {
    const initialState = get()

    // Don't mark if already being marked
    if (initialState.markingAsRead.has(notificationId)) {
      return
    }

    // Find the notification to check if it's already read
    const notification = initialState.notifications.find((n) => n.id === notificationId)
    if (!notification || notification.isRead) {
      // Already read or not found, nothing to do
      return
    }

    // Add to marking set
    const newMarkingAsRead = new Set(initialState.markingAsRead)
    newMarkingAsRead.add(notificationId)

    // OPTIMISTIC UPDATE: Update local state immediately before API call
    const optimisticNotifications = initialState.notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    )
    // Decrement total unread count by 1 (not recalculate from local list)
    const optimisticUnreadCount = Math.max(0, initialState.unreadCount - 1)

    // Capture the actual change made for accurate rollback
    // This prevents incorrect rollback when unreadCount was already 0
    const actualDecrement = initialState.unreadCount - optimisticUnreadCount

    // Invalidate any in-flight fetchUnreadCount() requests to prevent them
    // from overwriting this optimistic update with stale server data
    fetchUnreadCountRequestCounter += 1

    set({
      notifications: optimisticNotifications,
      unreadCount: optimisticUnreadCount,
      markingAsRead: newMarkingAsRead,
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

      // Revert notification back to unread
      const revertedNotifications = latestState.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: false } : n
      )
      // Revert unread count by the exact amount we decremented
      // This handles the case where unreadCount was 0 and didn't actually decrement
      const revertedUnreadCount = latestState.unreadCount + actualDecrement

      // Remove from marking set on error using latest state
      const finalMarkingAsRead = new Set(latestState.markingAsRead)
      finalMarkingAsRead.delete(notificationId)

      set({
        notifications: revertedNotifications,
        unreadCount: revertedUnreadCount,
        markingAsRead: finalMarkingAsRead,
        error: error instanceof Error ? error.message : 'Failed to mark notification as read',
      })

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

    set({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      totalPages: 0,
      isLoading: false,
      error: null,
      unreadCountError: null,
      markingAsRead: new Set<string>(),
    })
  },

  setPage: (page: number) => {
    set({ page })
    get().fetchNotifications(page, get().limit)
  },
}))
