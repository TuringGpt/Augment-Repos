import { create } from 'zustand'
import type { AdminUser, AdminUserDetail, UpdateAdminUserRequest } from '@features/accounts/types'
import { parseApiError, sanitizeErrorForLogging } from '@utils/errorUtils'

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

// Request counter to track the latest fetch-by-id request
// Prevents stale responses from overwriting newer state when fetching individual users
let fetchByIdRequestCounter = 0

// Track the user ID currently being fetched to prevent race conditions
// where updateAdminUser() might update currentAdminUser for a different user
let currentFetchingUserId: string | null = null

// Request counter to track the latest update request
// Prevents stale responses from overwriting newer state when updating users
let updateRequestCounter = 0

interface AccountState {
  // Admin users list state
  adminUsers: AdminUser[]
  total: number
  next: string | null
  previous: string | null
  currentPage: number
  totalPages: number
  isLoading: boolean
  error: string | null

  // Single admin user state (for detail view)
  currentAdminUser: AdminUserDetail | null
  isFetchingById: boolean
  fetchByIdError: string | null

  // Update admin user state
  isUpdating: boolean
  updateError: string | null

  // Actions
  setAdminUsers: (users: AdminUser[], count: number, next: string | null, previous: string | null) => void
  fetchAdminUsers: (page?: number) => Promise<void>
  fetchAdminUserById: (id: string) => Promise<void>
  updateAdminUser: (id: string, data: UpdateAdminUserRequest) => Promise<AdminUserDetail | undefined>
  clearCurrentAdminUser: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  clearAdminUsers: () => void
  setPage: (page: number) => void
}

export const useAccountStore = create<AccountState>((set, get) => ({
  // Initial state
  adminUsers: [],
  total: 0,
  next: null,
  previous: null,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  currentAdminUser: null,
  isFetchingById: false,
  fetchByIdError: null,
  isUpdating: false,
  updateError: null,

  // Actions
  setAdminUsers: (users, count, next, previous) =>
    set({
      adminUsers: users,
      total: count,
      next,
      previous,
    }),

  fetchAdminUsers: async (page = 1) => {
    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    // Only clamp the lower bound to prevent page <= 0
    // Don't clamp the upper bound here because totalPages might not be accurate yet
    // (it's initialized to 1 and not persisted). If the page is out of range, the
    // API will return an error which will be caught and displayed to the user.
    const validPage = Math.max(1, page)

    try {
      set({ isLoading: true, error: null })
      // Import accountsService dynamically to avoid circular dependency
      const { accountsService } = await import('@services/api/accounts/accountsService')
      const response = await accountsService.getAdminUsers(validPage)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId !== fetchRequestCounter) {
        // Request was invalidated - don't touch state as a newer request may be in-flight
        return
      }

      // Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
      const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings
      const totalPages = Math.max(1, Math.ceil(response.count / backendPageSize))

      set({
        adminUsers: response.users,
        total: response.count,
        next: response.next,
        previous: response.previous,
        currentPage: validPage,
        totalPages,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      // Only update error state if this is still the latest request
      // This prevents older errors from overwriting newer state
      if (requestId !== fetchRequestCounter) {
        // Request was invalidated - don't touch state as a newer request may be in-flight
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

  fetchAdminUserById: async (id: string) => {
    // Increment counter and capture the current request ID
    fetchByIdRequestCounter += 1
    const requestId = fetchByIdRequestCounter

    // Track which user ID we're fetching to prevent updateAdminUser from
    // incorrectly updating currentAdminUser when fetching a different user
    currentFetchingUserId = id

    set({ isFetchingById: true, fetchByIdError: null, currentAdminUser: null })
    try {
      // Import accountsService dynamically to avoid circular dependency
      const { accountsService } = await import('@services/api/accounts/accountsService')
      const user = await accountsService.getAdminUserById(id)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === fetchByIdRequestCounter) {
        set({
          currentAdminUser: user,
          isFetchingById: false,
        })
        // Clear the tracking variable since fetch completed
        // Only clear if it still matches this request's ID to prevent wiping a newer fetch
        if (currentFetchingUserId === id) {
          currentFetchingUserId = null
        }
      } else {
        // Request was invalidated - don't touch state as a newer request may be in-flight
        // Only clear the tracking variable if it still matches this request's ID
        // to prevent wiping a newer in-flight fetch's ID
        if (currentFetchingUserId === id) {
          currentFetchingUserId = null
        }
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      // This prevents older errors from overwriting newer state
      if (requestId !== fetchByIdRequestCounter) {
        // Request was invalidated - don't touch state as a newer request may be in-flight
        // Only clear the tracking variable if it still matches this request's ID
        // to prevent wiping a newer in-flight fetch's ID
        if (currentFetchingUserId === id) {
          currentFetchingUserId = null
        }
        return
      }

      // Use parseApiError to extract user-friendly error message from API response
      // This properly handles Django/DRF error responses including detail, non_field_errors, etc.
      const errorMessage = parseApiError(error, {
        defaultMessage: 'Failed to fetch admin user. Please try again.',
      })

      set({
        fetchByIdError: errorMessage,
        isFetchingById: false,
      })
      // Clear the tracking variable since fetch failed
      currentFetchingUserId = null

      // Log only sanitized error information to avoid leaking sensitive data
      // (e.g., Authorization headers in Axios config)
      console.error('Failed to fetch admin user by id:', sanitizeErrorForLogging(error))
    }
  },

  updateAdminUser: async (id: string, data: UpdateAdminUserRequest) => {
    // Increment counter and capture the current request ID
    updateRequestCounter += 1
    const requestId = updateRequestCounter

    try {
      set({ isUpdating: true, updateError: null })
      // Import accountsService dynamically to avoid circular dependency
      const { accountsService } = await import('@services/api/accounts/accountsService')
      const updatedUser = await accountsService.updateAdminUser(id, data)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId !== updateRequestCounter) {
        // Request was superseded - silently ignore the result to prevent
        // misleading success UI for stale requests
        return
      }

      // Invalidate any in-flight fetchAdminUsers() requests to prevent them
      // from overwriting the updated adminUsers list with stale data.
      // This fixes the race condition where an older fetch can resolve after
      // the update and revert the locally-updated role/isActive values.
      fetchRequestCounter += 1

      // Invalidate any in-flight fetchAdminUserById() requests to prevent them
      // from overwriting the currentAdminUser with stale data.
      // This fixes the race condition where an older fetch-by-id can resolve after
      // the update and revert the locally-updated currentAdminUser.
      fetchByIdRequestCounter += 1

      // Update currentAdminUser if it's for the same user
      // Check both the existing currentAdminUser and the tracked fetching ID
      // to ensure we only update when we're certain we're dealing with the same user
      const currentUser = get().currentAdminUser
      const wasFetchingThisUser = currentFetchingUserId === id
      if (currentUser?.id === id || wasFetchingThisUser) {
        set({ currentAdminUser: updatedUser })
      }

      // Clear the tracking variable to prevent the invalidated fetch from matching
      currentFetchingUserId = null

      // Update the user in the adminUsers list if it exists
      const adminUsers = get().adminUsers
      const updatedAdminUsers = adminUsers.map((user) => {
        if (user.id === id) {
          // Merge the updated fields with the existing user data
          // This preserves fields not returned by the update endpoint
          return {
            ...user,
            role: updatedUser.role,
            isActive: updatedUser.isActive,
          }
        }
        return user
      })
      set({ adminUsers: updatedAdminUsers })

      return updatedUser
    } catch (error) {
      // Only update error state if this is still the latest request
      // This prevents older errors from overwriting newer state
      if (requestId !== updateRequestCounter) {
        // Request was superseded - silently ignore the error to prevent
        // misleading error UI for stale requests
        return
      }

      // Use parseApiError to extract user-friendly error message from API response
      // This properly handles Django/DRF error responses including detail, non_field_errors, etc.
      const errorMessage = parseApiError(error, {
        defaultMessage: 'Failed to update admin user. Please try again.',
      })

      set({ updateError: errorMessage })

      // Log only sanitized error information to avoid leaking sensitive data
      // (e.g., Authorization headers in Axios config)
      console.error('Failed to update admin user:', sanitizeErrorForLogging(error))

      // Re-throw with the parsed error message so callers can display it (e.g., in toast notifications)
      // This ensures callers using `catch (e) => toast(e.message)` show the user-friendly parsed message
      // instead of the raw technical error message from the original exception
      throw new Error(errorMessage)
    } finally {
      // Only clear loading state if this is still the latest request
      if (requestId === updateRequestCounter) {
        set({ isUpdating: false })
      }
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  clearCurrentAdminUser: () => {
    // Increment counters to invalidate any in-flight fetch-by-id and update requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchByIdRequestCounter += 1
    updateRequestCounter += 1

    // Clear the tracking variable to prevent invalidated fetch from affecting updateAdminUser
    currentFetchingUserId = null

    set({
      currentAdminUser: null,
      isFetchingById: false,
      fetchByIdError: null,
      isUpdating: false,
      updateError: null,
    })
  },

  clearAdminUsers: () => {
    // Increment counters to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchRequestCounter += 1
    fetchByIdRequestCounter += 1
    updateRequestCounter += 1

    // Clear the tracking variable to prevent invalidated fetch from affecting updateAdminUser
    currentFetchingUserId = null

    set({
      adminUsers: [],
      total: 0,
      next: null,
      previous: null,
      currentPage: 1,
      totalPages: 1,
      isLoading: false,
      error: null,
      currentAdminUser: null,
      isFetchingById: false,
      fetchByIdError: null,
      isUpdating: false,
      updateError: null,
    })
  },

  setPage: (page: number) => {
    // Validate page before fetching
    // Clamp page to valid range (1 to totalPages). This provides stricter validation
    // than fetchAdminUsers, which only clamps the lower bound. This prevents unnecessary
    // API calls for out-of-range pages and provides immediate user feedback.
    const currentTotalPages = get().totalPages
    const validPage = Math.max(1, currentTotalPages > 0 ? Math.min(page, currentTotalPages) : page)

    // Set loading state immediately to provide visual feedback.
    // Note: currentPage is not updated here - it will be updated by fetchAdminUsers
    // only when the new data arrives successfully (line 96).
    set({ isLoading: true, error: null })
    get().fetchAdminUsers(validPage).catch((error) => {
      // Error is already handled in fetchAdminUsers, just prevent unhandled rejection
      console.error('Error fetching admin users on page change:', error)
    })
  },
}))
