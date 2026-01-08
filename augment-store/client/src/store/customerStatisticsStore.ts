import { create } from 'zustand'
import { customerStatisticsService } from '@services/api'
import type {
  CustomerRetentionResponse,
  CustomerRetentionParams,
  CustomerSegmentsResponse,
  CustomerSegmentsParams,
  NewVsReturningResponse,
  NewVsReturningParams,
} from '@features/customer-retention/types'

interface CustomerStatisticsState {
  // Data
  customerRetention: CustomerRetentionResponse | null
  customerSegments: CustomerSegmentsResponse | null
  newVsReturning: NewVsReturningResponse | null

  // Loading state
  isCustomerRetentionLoading: boolean
  isCustomerSegmentsLoading: boolean
  isNewVsReturningLoading: boolean

  // Error state
  customerRetentionError: string | null
  customerSegmentsError: string | null
  newVsReturningError: string | null

  // Actions
  fetchCustomerRetention: (params?: CustomerRetentionParams, signal?: AbortSignal) => Promise<void>
  fetchCustomerSegments: (params?: CustomerSegmentsParams, signal?: AbortSignal) => Promise<void>
  fetchNewVsReturning: (params?: NewVsReturningParams, signal?: AbortSignal) => Promise<void>
  clearCustomerRetentionError: () => void
  clearCustomerSegmentsError: () => void
  clearNewVsReturningError: () => void
  clearCustomerRetention: () => void
  clearCustomerSegments: () => void
  clearNewVsReturning: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let customerRetentionRequestCounter = 0
let customerSegmentsRequestCounter = 0
let newVsReturningRequestCounter = 0

export const useCustomerStatisticsStore = create<CustomerStatisticsState>((set) => ({
  // Initial state
  customerRetention: null,
  customerSegments: null,
  newVsReturning: null,
  isCustomerRetentionLoading: false,
  isCustomerSegmentsLoading: false,
  isNewVsReturningLoading: false,
  customerRetentionError: null,
  customerSegmentsError: null,
  newVsReturningError: null,

  // Actions
  fetchCustomerRetention: async (params?: CustomerRetentionParams, signal?: AbortSignal) => {
    const requestId = ++customerRetentionRequestCounter

    try {
      set({ isCustomerRetentionLoading: true, customerRetentionError: null })

      const data = await customerStatisticsService.getCustomerRetention(params, signal)

      // Only update state if this is still the latest request
      if (requestId === customerRetentionRequestCounter) {
        set({
          customerRetention: data,
          isCustomerRetentionLoading: false,
        })
      }
    } catch (error: unknown) {
      // Ignore abort errors
      const err = error as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        // Reset loading state if this was the latest request to prevent UI from getting stuck
        if (requestId === customerRetentionRequestCounter) {
          set({ isCustomerRetentionLoading: false })
        }
        return
      }

      // Only update error state if this is still the latest request
      if (requestId === customerRetentionRequestCounter) {
        let errorMessage = 'Failed to load customer retention statistics'

        if (err?.response?.status === 403) {
          errorMessage = 'You do not have permission to view customer retention statistics'
        } else if (err?.response?.status === 401) {
          errorMessage = 'Please log in to view customer retention statistics'
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err?.message) {
          errorMessage = err.message
        }

        set({
          customerRetentionError: errorMessage,
          isCustomerRetentionLoading: false,
        })
      }
    }
  },

  clearCustomerRetentionError: () => {
    set({ customerRetentionError: null })
  },

  clearCustomerRetention: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    customerRetentionRequestCounter += 1

    set({
      customerRetention: null,
      customerRetentionError: null,
      isCustomerRetentionLoading: false,
    })
  },

  fetchCustomerSegments: async (params?: CustomerSegmentsParams, signal?: AbortSignal) => {
    const requestId = ++customerSegmentsRequestCounter

    try {
      set({ isCustomerSegmentsLoading: true, customerSegmentsError: null })

      const data = await customerStatisticsService.getCustomerSegments(params, signal)

      // Only update state if this is still the latest request
      if (requestId === customerSegmentsRequestCounter) {
        set({
          customerSegments: data,
          isCustomerSegmentsLoading: false,
        })
      }
    } catch (error: unknown) {
      // Ignore abort errors
      const err = error as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        // Reset loading state if this was the latest request to prevent UI from getting stuck
        if (requestId === customerSegmentsRequestCounter) {
          set({ isCustomerSegmentsLoading: false })
        }
        return
      }

      // Only update error state if this is still the latest request
      if (requestId === customerSegmentsRequestCounter) {
        let errorMessage = 'Failed to load customer segments'

        if (err?.response?.status === 403) {
          errorMessage = 'You do not have permission to view customer segments'
        } else if (err?.response?.status === 401) {
          errorMessage = 'Please log in to view customer segments'
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err?.message) {
          errorMessage = err.message
        }

        set({
          customerSegmentsError: errorMessage,
          isCustomerSegmentsLoading: false,
        })
      }
    }
  },

  clearCustomerSegmentsError: () => {
    set({ customerSegmentsError: null })
  },

  clearCustomerSegments: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    customerSegmentsRequestCounter += 1

    set({
      customerSegments: null,
      customerSegmentsError: null,
      isCustomerSegmentsLoading: false,
    })
  },

  fetchNewVsReturning: async (params?: NewVsReturningParams, signal?: AbortSignal) => {
    const requestId = ++newVsReturningRequestCounter

    try {
      set({ isNewVsReturningLoading: true, newVsReturningError: null })

      const data = await customerStatisticsService.getNewVsReturning(params, signal)

      // Only update state if this is still the latest request
      if (requestId === newVsReturningRequestCounter) {
        set({
          newVsReturning: data,
          isNewVsReturningLoading: false,
        })
      }
    } catch (error: unknown) {
      // Ignore abort errors
      const err = error as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        // Reset loading state if this was the latest request to prevent UI from getting stuck
        if (requestId === newVsReturningRequestCounter) {
          set({ isNewVsReturningLoading: false })
        }
        return
      }

      // Only update error state if this is still the latest request
      if (requestId === newVsReturningRequestCounter) {
        let errorMessage = 'Failed to load new vs returning customers'

        if (err?.response?.status === 403) {
          errorMessage = 'You do not have permission to view new vs returning customers'
        } else if (err?.response?.status === 401) {
          errorMessage = 'Please log in to view new vs returning customers'
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err?.message) {
          errorMessage = err.message
        }

        set({
          newVsReturningError: errorMessage,
          isNewVsReturningLoading: false,
        })
      }
    }
  },

  clearNewVsReturningError: () => {
    set({ newVsReturningError: null })
  },

  clearNewVsReturning: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    newVsReturningRequestCounter += 1

    set({
      newVsReturning: null,
      newVsReturningError: null,
      isNewVsReturningLoading: false,
    })
  },
}))

