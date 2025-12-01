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
  markingAsRead: Set<string> // Track which notifications are being marked as read

  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  clearNotifications: () => void
  setPage: (page: number) => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  isLoading: false,
  error: null,
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
          unreadCount: response.unreadCount,
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

  markAsRead: async (notificationId: string) => {
    const state = get()

    // Don't mark if already being marked
    if (state.markingAsRead.has(notificationId)) {
      return
    }

    // Add to marking set
    const newMarkingAsRead = new Set(state.markingAsRead)
    newMarkingAsRead.add(notificationId)
    set({ markingAsRead: newMarkingAsRead })

    try {
      // Call API to mark as read
      await notificationService.markAsRead(notificationId)

      // Optimistically update local state
      const updatedNotifications = state.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )

      // Recalculate unread count
      const newUnreadCount = updatedNotifications.filter((n) => !n.isRead).length

      // Remove from marking set
      const finalMarkingAsRead = new Set(state.markingAsRead)
      finalMarkingAsRead.delete(notificationId)

      set({
        notifications: updatedNotifications,
        unreadCount: newUnreadCount,
        markingAsRead: finalMarkingAsRead,
      })
    } catch (error) {
      // Remove from marking set on error
      const finalMarkingAsRead = new Set(state.markingAsRead)
      finalMarkingAsRead.delete(notificationId)

      set({
        markingAsRead: finalMarkingAsRead,
        error: error instanceof Error ? error.message : 'Failed to mark notification as read',
      })

      // Re-throw to allow UI to handle error
      throw error
    }
  },

  clearNotifications: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchRequestCounter += 1

    set({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      totalPages: 0,
      isLoading: false,
      error: null,
      markingAsRead: new Set<string>(),
    })
  },

  setPage: (page: number) => {
    set({ page })
    get().fetchNotifications(page, get().limit)
  },
}))
