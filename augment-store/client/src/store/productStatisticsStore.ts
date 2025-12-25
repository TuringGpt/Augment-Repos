import { create } from 'zustand'
import { productStatisticsService } from '@services/api'
import type {
  ProductStatisticsResponse,
  ProductStatisticsParams,
  BestSellingProductsResponse,
  BestSellingProductsParams,
  MostViewedProductsResponse,
  MostViewedProductsParams,
  ProductPerformanceResponse,
  ProductPerformanceParams,
} from '@features/product-statistics/types'

interface ProductStatisticsState {
  // Data
  statistics: ProductStatisticsResponse | null
  bestSellingProducts: BestSellingProductsResponse | null
  mostViewedProducts: MostViewedProductsResponse | null
  productPerformance: ProductPerformanceResponse | null

  // Loading state
  isLoading: boolean
  isBestSellingLoading: boolean
  isMostViewedLoading: boolean
  isProductPerformanceLoading: boolean

  // Error state
  error: string | null
  bestSellingError: string | null
  mostViewedError: string | null
  productPerformanceError: string | null

  // Actions
  fetchStatistics: (params?: ProductStatisticsParams, signal?: AbortSignal) => Promise<void>
  fetchBestSellingProducts: (params?: BestSellingProductsParams, signal?: AbortSignal) => Promise<void>
  fetchMostViewedProducts: (params?: MostViewedProductsParams, signal?: AbortSignal) => Promise<void>
  fetchProductPerformance: (params?: ProductPerformanceParams, signal?: AbortSignal) => Promise<void>
  clearError: () => void
  clearStatisticsError: () => void
  clearBestSellingError: () => void
  clearMostViewedError: () => void
  clearStatistics: () => void
  clearBestSellingProducts: () => void
  clearMostViewedProducts: () => void
  clearProductPerformance: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let requestCounter = 0
let bestSellingRequestCounter = 0
let mostViewedRequestCounter = 0
let productPerformanceRequestCounter = 0

export const useProductStatisticsStore = create<ProductStatisticsState>((set) => ({
  // Initial state
  statistics: null,
  bestSellingProducts: null,
  mostViewedProducts: null,
  productPerformance: null,
  isLoading: false,
  isBestSellingLoading: false,
  isMostViewedLoading: false,
  isProductPerformanceLoading: false,
  error: null,
  bestSellingError: null,
  mostViewedError: null,
  productPerformanceError: null,

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

  fetchMostViewedProducts: async (params?: MostViewedProductsParams, signal?: AbortSignal) => {
    const requestId = ++mostViewedRequestCounter

    try {
      set({ isMostViewedLoading: true, mostViewedError: null })

      const data = await productStatisticsService.getMostViewedProducts(params, signal)

      // Only update state if this is still the latest request
      if (requestId === mostViewedRequestCounter) {
        set({
          mostViewedProducts: data,
          isMostViewedLoading: false,
        })
      }
    } catch (error: unknown) {
      // Ignore abort errors
      const err = error as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        // Reset loading state if this was the latest request to prevent UI from getting stuck
        if (requestId === mostViewedRequestCounter) {
          set({ isMostViewedLoading: false })
        }
        return
      }

      // Only update error state if this is still the latest request
      if (requestId === mostViewedRequestCounter) {
        let errorMessage = 'Failed to load most viewed products'

        if (err?.response?.status === 403) {
          errorMessage = 'You do not have permission to view most viewed products'
        } else if (err?.response?.status === 401) {
          errorMessage = 'Please log in to view most viewed products'
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err?.message) {
          errorMessage = err.message
        }

        set({
          mostViewedError: errorMessage,
          isMostViewedLoading: false,
        })
      }
    }
  },

  fetchProductPerformance: async (params?: ProductPerformanceParams, signal?: AbortSignal) => {
    const requestId = ++productPerformanceRequestCounter

    try {
      set({ isProductPerformanceLoading: true, productPerformanceError: null })

      const data = await productStatisticsService.getProductPerformance(params, signal)

      // Only update state if this is still the latest request
      if (requestId === productPerformanceRequestCounter) {
        set({
          productPerformance: data,
          isProductPerformanceLoading: false,
        })
      }
    } catch (error: unknown) {
      // Ignore abort errors
      const err = error as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        // Reset loading state if this was the latest request to prevent UI from getting stuck
        if (requestId === productPerformanceRequestCounter) {
          set({ isProductPerformanceLoading: false })
        }
        return
      }

      // Only update error state if this is still the latest request
      if (requestId === productPerformanceRequestCounter) {
        let errorMessage = 'Failed to load product performance'

        if (err?.response?.status === 403) {
          errorMessage = 'You do not have permission to view product performance'
        } else if (err?.response?.status === 401) {
          errorMessage = 'Please log in to view product performance'
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err?.message) {
          errorMessage = err.message
        }

        set({
          productPerformanceError: errorMessage,
          isProductPerformanceLoading: false,
        })
      }
    }
  },

  clearError: () => {
    set({ error: null, bestSellingError: null, mostViewedError: null, productPerformanceError: null })
  },

  clearStatisticsError: () => {
    set({ error: null })
  },

  clearBestSellingError: () => {
    set({ bestSellingError: null })
  },

  clearMostViewedError: () => {
    set({ mostViewedError: null })
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

  clearMostViewedProducts: () => {
    set({
      mostViewedProducts: null,
      mostViewedError: null,
    })
  },

  clearProductPerformance: () => {
    set({
      productPerformance: null,
      productPerformanceError: null,
    })
  },
}))

