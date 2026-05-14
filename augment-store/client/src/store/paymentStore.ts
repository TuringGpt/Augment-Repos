import { create } from 'zustand'
import type { AdminPayment } from '@features/payment/types'
import { parseApiError, sanitizeErrorForLogging, isAbortError } from '@utils/errorUtils'

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

interface PaymentState {
  // Admin payments list state
  adminPayments: AdminPayment[]
  total: number
  next: string | null
  previous: string | null
  currentPage: number
  totalPages: number
  isLoading: boolean
  error: string | null

  // Actions
  setAdminPayments: (payments: AdminPayment[], count: number, next: string | null, previous: string | null, currentPage?: number) => void
  fetchAdminPayments: (page?: number, signal?: AbortSignal) => Promise<void>
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  clearAdminPayments: () => void
  setPage: (page: number) => void
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  // Initial state
  adminPayments: [],
  total: 0,
  next: null,
  previous: null,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,

  // Actions
  setAdminPayments: (payments, count, next, previous, currentPage) => {
    // Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
    const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings
    const totalPages = Math.max(1, Math.ceil(count / backendPageSize))

    set({
      adminPayments: payments,
      total: count,
      next,
      previous,
      currentPage: currentPage ?? get().currentPage, // Use provided page or keep current
      totalPages,
    })
  },

  fetchAdminPayments: async (page = 1, signal?: AbortSignal) => {
    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    // Normalize page to a finite integer, then clamp to >= 1
    // This handles NaN, Infinity, -Infinity, and non-integer values
    // Only clamp the lower bound here because totalPages might not be accurate yet
    // (it's initialized to 1 and not persisted). If the page is out of range, the
    // API will return an error which will be caught and displayed to the user.
    const validPage = Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1)

    try {
      set({ isLoading: true, error: null })
      // Import paymentService dynamically to avoid circular dependency
      const { paymentService } = await import('@services/api/payment/paymentService')
      const response = await paymentService.getAdminPayments(validPage, signal)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId !== fetchRequestCounter) {
        return
      }

      // Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
      const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings
      const totalPages = Math.max(1, Math.ceil(response.count / backendPageSize))

      set({
        adminPayments: response.payments,
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
        return
      }

      // Don't treat intentional cancellations as fetch errors
      if (isAbortError(error)) {
        // Request was intentionally cancelled (e.g., component unmount or navigation)
        // Reset loading state but don't set error
        set({ isLoading: false })
        return
      }

      // Use parseApiError to extract user-friendly error message from API response
      // This properly handles Django/DRF error responses including detail, non_field_errors, etc.
      const errorMessage = parseApiError(error, {
        defaultMessage: 'Failed to fetch admin payments. Please try again.',
      })

      set({
        error: errorMessage,
        isLoading: false,
      })

      // Log only sanitized error information to avoid leaking sensitive data
      // (e.g., Authorization headers in Axios config)
      console.error('Failed to fetch admin payments:', sanitizeErrorForLogging(error))
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  clearAdminPayments: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchRequestCounter += 1

    set({
      adminPayments: [],
      total: 0,
      next: null,
      previous: null,
      currentPage: 1,
      totalPages: 1,
      isLoading: false,
      error: null,
    })
  },

  setPage: (page: number) => {
    // Normalize page to a finite integer first to handle NaN, Infinity, etc.
    // Then clamp page to valid range (1 to totalPages). This provides stricter validation
    // than fetchAdminPayments, which only clamps the lower bound. This prevents unnecessary
    // API calls for out-of-range pages and provides immediate user feedback.
    const normalizedPage = Number.isFinite(page) ? Math.floor(page) : 1
    const currentTotalPages = get().totalPages
    const validPage = Math.max(1, currentTotalPages > 0 ? Math.min(normalizedPage, currentTotalPages) : normalizedPage)

    // Set loading state immediately to provide visual feedback.
    // Note: currentPage is not updated here - it will be updated by fetchAdminPayments
    // only when the new data arrives successfully (line 86).
    set({ isLoading: true, error: null })
    get().fetchAdminPayments(validPage).catch((error) => {
      // Error is already handled in fetchAdminPayments, just prevent unhandled rejection
      console.error('Error fetching admin payments on page change:', error)
    })
  },
}))
