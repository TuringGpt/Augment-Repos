import { create } from 'zustand'
import type { Product, ProductSearchParams } from '@features/products/types'
import type { ProductStatisticsDetail } from '@features/product-statistics/types'
import { productStatisticsService, productService } from '@services/api'

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
  fetchProducts: (params?: Partial<ProductSearchParams>) => Promise<void>
  setProducts: (products: Product[], total: number, page: number, totalPages: number) => void
  setSelectedProduct: (product: Product | null) => void
  setSearchParams: (params: Partial<ProductSearchParams>) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearProducts: () => void
  deleteProduct: (productId: string) => Promise<void>

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

  fetchProducts: async (params?: Partial<ProductSearchParams>) => {
    try {
      set({ isLoading: true, error: null })

      const response = await productService.getProducts(params)

      set({
        products: response.products,
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
        isLoading: false,
      })
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }

      let errorMessage = 'Failed to load products'

      if (err?.response?.status === 403) {
        errorMessage = 'You do not have permission to view products'
      } else if (err?.response?.status === 401) {
        errorMessage = 'Please log in to view products'
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.message) {
        errorMessage = err.message
      }

      set({ error: errorMessage, isLoading: false })
      // Note: Not rethrowing error since state is already updated.
      // Callers can check the error state instead of relying on try-catch.
    }
  },

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

  deleteProduct: async (productId: string) => {
    try {
      // Call the API to delete the product
      await productService.deleteProduct(productId)

      // Remove the product from the local state and update pagination
      set((state) => {
        // Check if the product exists in the current list
        const productExists = state.products.some((product) => product.id === productId)

        // Calculate new total
        const newTotal = productExists ? Math.max(0, state.total - 1) : state.total

        // Backend uses fixed page size of 100
        const backendPageSize = 100

        // Recalculate total pages based on new total
        const newTotalPages = Math.ceil(newTotal / backendPageSize)

        // Clamp current page to valid range [1, newTotalPages] to prevent invalid pagination state
        // This prevents issues when deleting the last item on the last page
        const newPage = newTotalPages > 0 ? Math.max(1, Math.min(state.page, newTotalPages)) : 1

        return {
          products: state.products.filter((product) => product.id !== productId),
          total: newTotal,
          page: newPage,
          totalPages: newTotalPages,
          // If the deleted product was selected, clear the selection
          selectedProduct: state.selectedProduct?.id === productId ? null : state.selectedProduct,
        }
      })

      // Also clear any statistics for this product
      get().clearProductStatistics(productId)
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }

      let errorMessage = 'Failed to delete product'

      if (err?.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this product'
      } else if (err?.response?.status === 401) {
        errorMessage = 'Please log in to delete products'
      } else if (err?.response?.status === 404) {
        errorMessage = 'Product not found'
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.message) {
        errorMessage = err.message
      }

      set({ error: errorMessage })
      throw error
    }
  },

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
