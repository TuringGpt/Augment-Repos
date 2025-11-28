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

  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>
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

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      totalPages: 0,
      error: null,
    })
  },

  setPage: (page: number) => {
    set({ page })
    get().fetchNotifications(page, get().limit)
  },
}))
