import { create } from 'zustand'
import type { AdminUser } from '@features/accounts/types'
import { parseApiError, sanitizeErrorForLogging } from '@utils/errorUtils'

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

interface AccountState {
  // Admin users list state
  adminUsers: AdminUser[]
  total: number
  next: string | null
  previous: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setAdminUsers: (users: AdminUser[], count: number, next: string | null, previous: string | null) => void
  fetchAdminUsers: () => Promise<void>
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  clearAdminUsers: () => void
}

export const useAccountStore = create<AccountState>((set) => ({
  // Initial state
  adminUsers: [],
  total: 0,
  next: null,
  previous: null,
  isLoading: false,
  error: null,

  // Actions
  setAdminUsers: (users, count, next, previous) =>
    set({
      adminUsers: users,
      total: count,
      next,
      previous,
    }),

  fetchAdminUsers: async () => {
    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    try {
      set({ isLoading: true, error: null })
      // Import accountsService dynamically to avoid circular dependency
      const { accountsService } = await import('@services/api/accounts/accountsService')
      const response = await accountsService.getAdminUsers()

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId !== fetchRequestCounter) {
        return
      }

      set({
        adminUsers: response.users,
        total: response.count,
        next: response.next,
        previous: response.previous,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      // Only update error state if this is still the latest request
      // This prevents older errors from overwriting newer state
      if (requestId !== fetchRequestCounter) {
        return
      }

      // Use parseApiError to extract user-friendly error message from API response
      // This properly handles Django/DRF error responses including detail, non_field_errors, etc.
      const errorMessage = parseApiError(error, {
        defaultMessage: 'Failed to fetch admin users. Please try again.',
      })

      set({
        error: errorMessage,
        isLoading: false,
      })

      // Log only sanitized error information to avoid leaking sensitive data
      // (e.g., Authorization headers in Axios config)
      console.error('Failed to fetch admin users:', sanitizeErrorForLogging(error))
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  clearAdminUsers: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchRequestCounter += 1

    set({
      adminUsers: [],
      total: 0,
      next: null,
      previous: null,
      isLoading: false,
      error: null,
    })
  },
}))
