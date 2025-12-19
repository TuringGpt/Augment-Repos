import { create } from 'zustand'
import { productStatisticsService } from '@services/api'
import type {
  ProductStatisticsResponse,
  ProductStatisticsParams,
} from '@features/product-statistics/types'

interface ProductStatisticsState {
  // Data
  statistics: ProductStatisticsResponse | null

  // Loading state
  isLoading: boolean

  // Error state
  error: string | null

  // Actions
  fetchStatistics: (params?: ProductStatisticsParams, signal?: AbortSignal) => Promise<void>
  clearError: () => void
  clearStatistics: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let requestCounter = 0

export const useProductStatisticsStore = create<ProductStatisticsState>((set) => ({
  // Initial state
  statistics: null,
  isLoading: false,
  error: null,

  // Actions
  fetchStatistics: async (params?: ProductStatisticsParams, signal?: AbortSignal) => {
    const requestId = ++requestCounter

    try {
      set({ isLoading: true, error: null })

      const data = await productStatisticsService.getProductStatistics(params, signal)

      // Only update state if this is still the latest request
      if (requestId === requestCounter) {
        set({
          statistics: data,
          isLoading: false,
        })
      }
    } catch (error: unknown) {
      // Ignore abort errors
      const err = error as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        // Reset loading state if this was the latest request to prevent UI from getting stuck
        if (requestId === requestCounter) {
          set({ isLoading: false })
        }
        return
      }

      // Only update error state if this is still the latest request
      if (requestId === requestCounter) {
        let errorMessage = 'Failed to load product statistics'

        if (err?.response?.status === 403) {
          errorMessage = 'You do not have permission to view product statistics'
        } else if (err?.response?.status === 401) {
          errorMessage = 'Please log in to view product statistics'
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err?.message) {
          errorMessage = err.message
        }

        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    }
  },

  clearError: () => {
    set({ error: null })
  },

  clearStatistics: () => {
    set({
      statistics: null,
      error: null,
    })
  },
}))

