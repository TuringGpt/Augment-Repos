import { create } from 'zustand'
import type { Product, ProductSearchParams } from '@features/products/types'
import type { ProductStatisticsDetail } from '@features/product-statistics/types'
import { productStatisticsService } from '@services/api'

interface ProductState {
  products: Product[]
  selectedProduct: Product | null
  searchParams: ProductSearchParams
  isLoading: boolean
  error: string | null
  total: number
  page: number
  totalPages: number

  // Product statistics
  productStatistics: Record<string, ProductStatisticsDetail>
  loadingStatistics: Record<string, boolean>
  statisticsErrors: Record<string, string | undefined>

  // Actions
  setProducts: (products: Product[], total: number, page: number, totalPages: number) => void
  setSelectedProduct: (product: Product | null) => void
  setSearchParams: (params: Partial<ProductSearchParams>) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearProducts: () => void

  // Product statistics actions
  fetchProductStatistics: (productId: string, signal?: AbortSignal) => Promise<void>
  getProductStatistics: (productId: string) => ProductStatisticsDetail | null
  isLoadingStatistics: (productId: string) => boolean
  getStatisticsError: (productId: string) => string | null
  clearProductStatistics: (productId?: string) => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  selectedProduct: null,
  searchParams: {
    page: 1,
    limit: 12,
  },
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 0,

  // Product statistics state
  productStatistics: {},
  loadingStatistics: {},
  statisticsErrors: {},

  setProducts: (products, total, page, totalPages) =>
    set({
      products,
      total,
      page,
      totalPages,
    }),

  setSelectedProduct: (product) => set({ selectedProduct: product }),

  setSearchParams: (params) =>
    set((state) => ({
      searchParams: { ...state.searchParams, ...params },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearProducts: () =>
    set({
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
    }),

  // Product statistics actions
  fetchProductStatistics: async (productId: string, signal?: AbortSignal) => {
    try {
      set((state) => ({
        loadingStatistics: {
          ...state.loadingStatistics,
          [productId]: true,
        },
        statisticsErrors: {
          ...state.statisticsErrors,
          [productId]: undefined,
        },
      }))

      const statistics = await productStatisticsService.getProductStatisticsById(productId, signal)

      set((state) => ({
        productStatistics: {
          ...state.productStatistics,
          [productId]: statistics,
        },
        loadingStatistics: {
          ...state.loadingStatistics,
          [productId]: false,
        },
      }))
    } catch (error: unknown) {
      // Ignore abort errors
      const err = error as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        set((state) => ({
          loadingStatistics: {
            ...state.loadingStatistics,
            [productId]: false,
          },
        }))
        return
      }

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

      set((state) => ({
        statisticsErrors: {
          ...state.statisticsErrors,
          [productId]: errorMessage,
        },
        loadingStatistics: {
          ...state.loadingStatistics,
          [productId]: false,
        },
      }))
    }
  },

  getProductStatistics: (productId: string) => {
    const state = get()
    return state.productStatistics[productId] ?? null
  },

  isLoadingStatistics: (productId: string) => {
    const state = get()
    return state.loadingStatistics[productId] ?? false
  },

  getStatisticsError: (productId: string) => {
    const state = get()
    return state.statisticsErrors[productId] ?? null
  },

  clearProductStatistics: (productId?: string) => {
    if (productId) {
      set((state) => {
        const { [productId]: _, ...restStatistics } = state.productStatistics
        const { [productId]: __, ...restLoading } = state.loadingStatistics
        const { [productId]: ___, ...restErrors } = state.statisticsErrors
        return {
          productStatistics: restStatistics,
          loadingStatistics: restLoading,
          statisticsErrors: restErrors,
        }
      })
    } else {
      set({
        productStatistics: {},
        loadingStatistics: {},
        statisticsErrors: {},
      })
    }
  },
}))
