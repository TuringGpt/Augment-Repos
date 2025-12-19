import { create } from 'zustand'
import type { AdminAnalyticsOverviewResponse } from '@features/admin-dashboard/types'

// Request counter to prevent race conditions when fetching analytics
// When multiple fetch calls are made in quick succession,
// only the most recent request should update the analytics state
let fetchAnalyticsRequestCounter = 0

interface AdminDashboardState {
  // Analytics data
  analytics: AdminAnalyticsOverviewResponse | null
  days: number

  // Loading states
  isLoading: boolean

  // Error states
  error: string | null

  // Actions
  fetchAnalytics: (days?: number, signal?: AbortSignal) => Promise<AdminAnalyticsOverviewResponse>
  setDays: (days: number) => void
  clearAnalytics: () => void
  clearError: () => void
}

export const useAdminDashboardStore = create<AdminDashboardState>((set, get) => ({
  // Initial state
  analytics: null,
  days: 30,
  isLoading: false,
  error: null,

  // Actions
  fetchAnalytics: async (days?: number, signal?: AbortSignal) => {
    // Import adminDashboardService dynamically to avoid circular dependency
    const { adminDashboardService } = await import('@services/api/admin-dashboard/adminDashboardService')

    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    fetchAnalyticsRequestCounter += 1
    const currentRequestId = fetchAnalyticsRequestCounter

    // Use provided days or current state days
    const daysToFetch = days ?? get().days

    try {
      // Only update loading state if this is still the most recent request
      if (currentRequestId === fetchAnalyticsRequestCounter) {
        set({ isLoading: true, error: null })
      }

      const data = await adminDashboardService.getAnalyticsOverview(daysToFetch, signal)

      // Only update state if this is still the most recent request and not aborted
      if (currentRequestId === fetchAnalyticsRequestCounter && !signal?.aborted) {
        set({ analytics: data, days: daysToFetch })
      }

      return data
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts or new request starts
      const error = err as {
        name?: string
        response?: { status?: number; data?: { message?: string } }
        message?: string
      }

      if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
        console.log('Analytics request was cancelled')
        throw err
      }

      // Only update error state if this is still the most recent request
      if (currentRequestId !== fetchAnalyticsRequestCounter) {
        throw err
      }

      // Extract meaningful error message
      let errorMessage = 'Failed to fetch admin analytics data'

      if (error?.response?.status === 404) {
        errorMessage =
          'Analytics endpoint not found. Please ensure the backend API is running and the endpoint exists.'
      } else if (error?.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view analytics.'
      } else if (error?.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.'
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }

      set({ error: errorMessage })
      console.error('Error fetching admin dashboard analytics:', {
        error,
        status: error?.response?.status,
        data: error?.response?.data,
        message: errorMessage,
      })

      throw err
    } finally {
      // Only update loading state if this is still the most recent request
      if (currentRequestId === fetchAnalyticsRequestCounter) {
        set({ isLoading: false })
      }
    }
  },

  setDays: (days: number) => {
    set({ days })
    // Automatically fetch analytics when days changes
    get()
      .fetchAnalytics(days)
      .catch((error) => {
        // Error is already handled in fetchAnalytics, just prevent unhandled rejection
        console.error('Error fetching analytics on days change:', error)
      })
  },

  clearAnalytics: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchAnalyticsRequestCounter += 1
    set({
      analytics: null,
      error: null,
      isLoading: false,
    })
  },

  clearError: () => set({ error: null }),
}))

