import { create } from 'zustand'
import { productStatisticsService } from '@services/api'
import type {
  ProductStatisticsResponse,
  ProductStatisticsParams,
  BestSellingProductsResponse,
  BestSellingProductsParams,
} from '@features/product-statistics/types'

interface ProductStatisticsState {
  // Data
  statistics: ProductStatisticsResponse | null
  bestSellingProducts: BestSellingProductsResponse | null

  // Loading state
  isLoading: boolean
  isBestSellingLoading: boolean

  // Error state
  error: string | null
  bestSellingError: string | null

  // Actions
  fetchStatistics: (params?: ProductStatisticsParams, signal?: AbortSignal) => Promise<void>
  fetchBestSellingProducts: (params?: BestSellingProductsParams, signal?: AbortSignal) => Promise<void>
  clearError: () => void
  clearStatistics: () => void
  clearBestSellingProducts: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let requestCounter = 0
let bestSellingRequestCounter = 0

export const useProductStatisticsStore = create<ProductStatisticsState>((set) => ({
  // Initial state
  statistics: null,
  bestSellingProducts: null,
  isLoading: false,
  isBestSellingLoading: false,
  error: null,
  bestSellingError: null,

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

  fetchBestSellingProducts: async (params?: BestSellingProductsParams, signal?: AbortSignal) => {
    const requestId = ++bestSellingRequestCounter

    try {
      set({ isBestSellingLoading: true, bestSellingError: null })

      const data = await productStatisticsService.getBestSellingProducts(params, signal)

      // Only update state if this is still the latest request
      if (requestId === bestSellingRequestCounter) {
        set({
          bestSellingProducts: data,
          isBestSellingLoading: false,
        })
      }
    } catch (error: unknown) {
      // Ignore abort errors
      const err = error as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        // Reset loading state if this was the latest request to prevent UI from getting stuck
        if (requestId === bestSellingRequestCounter) {
          set({ isBestSellingLoading: false })
        }
        return
      }

      // Only update error state if this is still the latest request
      if (requestId === bestSellingRequestCounter) {
        let errorMessage = 'Failed to load best selling products'

        if (err?.response?.status === 403) {
          errorMessage = 'You do not have permission to view best selling products'
        } else if (err?.response?.status === 401) {
          errorMessage = 'Please log in to view best selling products'
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err?.message) {
          errorMessage = err.message
        }

        set({
          bestSellingError: errorMessage,
          isBestSellingLoading: false,
        })
      }
    }
  },

  clearError: () => {
    set({ error: null, bestSellingError: null })
  },

  clearStatistics: () => {
    set({
      statistics: null,
      error: null,
    })
  },

  clearBestSellingProducts: () => {
    set({
      bestSellingProducts: null,
      bestSellingError: null,
    })
  },
}))

