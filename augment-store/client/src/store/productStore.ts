import { create } from 'zustand'
import type { Product, ProductSearchParams } from '@features/products/types'
import type { ProductStatisticsDetail } from '@features/product-statistics/types'
import type { UpdateProductRequest, CreateProductRequest } from '@features/products/types/api'
import { PLACEHOLDER_IMAGE } from '@features/products/types/api'
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
  createProduct: (data: CreateProductRequest) => Promise<Product>
  deleteProduct: (productId: string) => Promise<void>
  updateProduct: (productId: string, data: UpdateProductRequest) => Promise<void>

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

      // Use error codes instead of hardcoded English messages
      // Components will translate these using i18n
      let errorCode = 'PRODUCTS_LOAD_ERROR'

      if (err?.response?.status === 403) {
        errorCode = 'PRODUCTS_PERMISSION_DENIED'
      } else if (err?.response?.status === 401) {
        errorCode = 'PRODUCTS_AUTH_REQUIRED'
      } else if (err?.response?.data?.message) {
        // If backend provides a message, use it as-is (may already be localized)
        errorCode = err.response.data.message
      } else if (err?.message) {
        // For network errors or other client-side errors, use the error message
        errorCode = err.message
      }

      set({ error: errorCode, isLoading: false })
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

  createProduct: async (data: CreateProductRequest): Promise<Product> => {
    try {
      // Clear any previous error state
      set({ error: null })

      // Call the API to create the product
      // Note: CreateProductSerializer returns basic fields only (no timestamps or nested objects)
      const createdProductAPI = await productService.createProduct(data)

      // Fetch the full product details to get timestamps and nested objects
      // This is necessary because CreateProductSerializer doesn't include these fields
      const productDetailAPI = await productService.getProductById(createdProductAPI.id)

      // Transform the full product detail to frontend Product format
      // Extract image URLs from FileAPI objects
      const imageUrls = productDetailAPI.images
        .map((fileObj) => fileObj.file)
        .filter((url): url is string => url !== null)

      const newProduct: Product = {
        id: productDetailAPI.id,
        name: productDetailAPI.name,
        description: productDetailAPI.description,
        price: parseFloat(productDetailAPI.price),
        stock: productDetailAPI.quantity,
        rating: parseFloat(productDetailAPI.rating),
        images: imageUrls.length > 0 ? imageUrls : [PLACEHOLDER_IMAGE],
        category: {
          id: productDetailAPI.category.id,
          name: productDetailAPI.category.name,
          slug: productDetailAPI.category.name.toLowerCase().replace(/\s+/g, '-'),
          description: productDetailAPI.category.description,
          image: productDetailAPI.category.image?.file || undefined,
          parent: productDetailAPI.category.parent || undefined,
        },
        reviewCount: 0,
        createdAt: productDetailAPI.created_at,
        updatedAt: productDetailAPI.updated_at,
      }

      // Add the new product to the local state and update pagination
      set((state) => {
        // Backend uses fixed page size of 100
        const backendPageSize = 100

        // Calculate new total
        const newTotal = state.total + 1

        // Recalculate total pages based on new total
        const newTotalPages = Math.ceil(newTotal / backendPageSize)

        // Add the new product to the beginning of the list
        return {
          products: [newProduct, ...state.products],
          total: newTotal,
          totalPages: newTotalPages,
        }
      })

      return newProduct
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }

      // Use error codes instead of hardcoded English messages
      // Components will translate these using i18n
      let errorCode = 'PRODUCT_CREATE_ERROR'

      if (err?.response?.status === 403) {
        errorCode = 'PRODUCT_CREATE_PERMISSION_DENIED'
      } else if (err?.response?.status === 401) {
        errorCode = 'PRODUCT_CREATE_AUTH_REQUIRED'
      } else if (err?.response?.status === 400) {
        errorCode = 'PRODUCT_CREATE_VALIDATION_ERROR'
      } else if (err?.response?.data?.message) {
        // If backend provides a message, use it as-is (may already be localized)
        errorCode = err.response.data.message
      } else if (err?.message) {
        // For network errors or other client-side errors, use the error message
        errorCode = err.message
      }

      set({ error: errorCode })
      throw error
    }
  },

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

      // Use error codes instead of hardcoded English messages
      // Components will translate these using i18n
      let errorCode = 'PRODUCT_DELETE_ERROR'

      if (err?.response?.status === 403) {
        errorCode = 'PRODUCT_DELETE_PERMISSION_DENIED'
      } else if (err?.response?.status === 401) {
        errorCode = 'PRODUCT_DELETE_AUTH_REQUIRED'
      } else if (err?.response?.status === 404) {
        errorCode = 'PRODUCT_NOT_FOUND'
      } else if (err?.response?.data?.message) {
        // If backend provides a message, use it as-is (may already be localized)
        errorCode = err.response.data.message
      } else if (err?.message) {
        // For network errors or other client-side errors, use the error message
        errorCode = err.message
      }

      set({ error: errorCode })
      throw error
    }
  },

  updateProduct: async (productId: string, data: UpdateProductRequest) => {
    try {
      // Clear any previous error state
      set({ error: null })

      // Call the API to update the product
      const updatedProductAPI = await productService.updateProduct(productId, data)

      // Update the product in the local state
      set((state) => {
        const updatedProducts = state.products.map((product) => {
          if (product.id === productId) {
            // Merge the updated data with the existing product
            return {
              ...product,
              name: updatedProductAPI.name,
              description: updatedProductAPI.description,
              price: parseFloat(updatedProductAPI.price),
              stock: updatedProductAPI.quantity,
              rating: parseFloat(updatedProductAPI.rating),
            }
          }
          return product
        })

        // If the updated product was selected, update the selection
        const updatedSelectedProduct =
          state.selectedProduct?.id === productId
            ? updatedProducts.find((p) => p.id === productId) ?? null
            : state.selectedProduct

        return {
          products: updatedProducts,
          selectedProduct: updatedSelectedProduct,
        }
      })
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string }

      // Use error codes instead of hardcoded English messages
      // Components will translate these using i18n
      let errorCode = 'PRODUCT_UPDATE_ERROR'

      if (err?.response?.status === 403) {
        errorCode = 'PRODUCT_UPDATE_PERMISSION_DENIED'
      } else if (err?.response?.status === 401) {
        errorCode = 'PRODUCT_UPDATE_AUTH_REQUIRED'
      } else if (err?.response?.status === 404) {
        errorCode = 'PRODUCT_NOT_FOUND'
      } else if (err?.response?.data?.message) {
        // If backend provides a message, use it as-is (may already be localized)
        errorCode = err.response.data.message
      } else if (err?.message) {
        // For network errors or other client-side errors, use the error message
        errorCode = err.message
      }

      set({ error: errorCode })
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

      // Use error codes instead of hardcoded English messages
      // Components will translate these using i18n
      let errorCode = 'PRODUCT_STATISTICS_LOAD_ERROR'

      if (err?.response?.status === 403) {
        errorCode = 'PRODUCT_STATISTICS_PERMISSION_DENIED'
      } else if (err?.response?.status === 401) {
        errorCode = 'PRODUCT_STATISTICS_AUTH_REQUIRED'
      } else if (err?.response?.data?.message) {
        // If backend provides a message, use it as-is (may already be localized)
        errorCode = err.response.data.message
      } else if (err?.message) {
        // For network errors or other client-side errors, use the error message
        errorCode = err.message
      }

      set((state) => ({
        statisticsErrors: {
          ...state.statisticsErrors,
          [productId]: errorCode,
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
