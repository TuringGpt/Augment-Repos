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
  isLoadingStatistics: boolean
  statisticsError: string | null

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
  isLoadingStatistics: false,
  statisticsError: null,

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
      set({ isLoadingStatistics: true, statisticsError: null })

      const statistics = await productStatisticsService.getProductStatisticsById(productId, signal)

      set((state) => ({
        productStatistics: {
          ...state.productStatistics,
          [productId]: statistics,
        },
        isLoadingStatistics: false,
      }))
    } catch (error: unknown) {
      // Ignore abort errors
      const err = error as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
        set({ isLoadingStatistics: false })
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

      set({
        statisticsError: errorMessage,
        isLoadingStatistics: false,
      })
    }
  },

  getProductStatistics: (productId: string) => {
    const state = get()
    return state.productStatistics[productId] ?? null
  },

  clearProductStatistics: (productId?: string) => {
    if (productId) {
      set((state) => {
        const { [productId]: _, ...rest } = state.productStatistics
        return {
          productStatistics: rest,
          statisticsError: null,
        }
      })
    } else {
      set({
        productStatistics: {},
        statisticsError: null,
      })
    }
  },
}))
