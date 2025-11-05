import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Product,
  ProductListResponse,
  ProductSearchParams,
  Category,
  CategoryAPIResponse,
} from '@features/products/types'
import type { PaginatedProductsAPI, ProductDetailAPI } from '@features/products/types/api'
import { transformProductFromAPI } from '@features/products/types/api'

export const productService = {
  /**
   * Get products from backend API
   * Backend returns paginated response with count, next, previous, results
   * Note: Backend has fixed page_size of 100 (configured in settings.py)
   */
  getProducts: async (params?: ProductSearchParams): Promise<ProductListResponse> => {
    try {
      const page = params?.page || 1
      const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings

      // Fetch products from backend with pagination
      // Note: page_size is fixed at 100 on backend, cannot be overridden
      const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.PRODUCTS.LIST, {
        params: {
          page,
        },
      })

      console.log('🔍 Raw API Response:', {
        count: response.count,
        resultsLength: response.results.length,
        next: response.next,
        previous: response.previous,
      })

      // Transform backend products to frontend format
      const products: Product[] = response.results.map(transformProductFromAPI)

      console.log('✅ Transformed Products:', {
        transformedCount: products.length,
        firstProduct: products[0],
      })

      return {
        products,
        total: response.count,
        page,
        limit: backendPageSize,
        totalPages: Math.ceil(response.count / backendPageSize),
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      // Return empty response on error
      return {
        products: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      }
    }
  },

  getProductById: async (id: string): Promise<ProductDetailAPI> => {
    try {
      // Fetch product detail from backend
      const response = await apiClient.get<ProductDetailAPI>(API_ENDPOINTS.PRODUCTS.DETAIL(id))
      return response
    } catch (error) {
      console.error('Failed to fetch product by ID:', error)
      throw error
    }
  },

  searchProducts: async (
    query: string,
    params?: ProductSearchParams
  ): Promise<ProductListResponse> => {
    try {
      const uiPage = params?.page || 1
      const limit = params?.limit || 12
      const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings

      // Calculate which backend page to fetch based on UI pagination
      // UI offset: where we want to start in the full result set
      const uiOffset = (uiPage - 1) * limit
      // Backend page: which backend page contains our UI offset
      const backendPage = Math.floor(uiOffset / backendPageSize) + 1
      // Offset within the backend page results
      const offsetInBackendPage = uiOffset % backendPageSize

      // Check if we need to fetch the next backend page too
      const needsNextPage = offsetInBackendPage + limit > backendPageSize

      // Fetch the first backend page
      const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.PRODUCTS.LIST, {
        params: {
          page: backendPage,
          search: query,
        },
      })

      // Transform backend products to frontend format
      let allProducts: Product[] = response.results.map(transformProductFromAPI)

      // If we need more items from the next page, fetch it
      if (needsNextPage && response.next) {
        const nextResponse = await apiClient.get<PaginatedProductsAPI>(
          API_ENDPOINTS.PRODUCTS.LIST,
          {
            params: {
              page: backendPage + 1,
              search: query,
            },
          }
        )
        const nextProducts = nextResponse.results.map(transformProductFromAPI)
        allProducts = [...allProducts, ...nextProducts]
      }

      // Slice the correct range from combined results
      const limitedProducts = allProducts.slice(offsetInBackendPage, offsetInBackendPage + limit)

      return {
        products: limitedProducts,
        total: response.count,
        page: uiPage,
        limit,
        // Calculate totalPages based on the limit returned in the response
        totalPages: Math.ceil(response.count / limit),
      }
    } catch (error) {
      console.error('Failed to search products:', error)
      return {
        products: [],
        total: 0,
        page: 1,
        limit: params?.limit || 12,
        totalPages: 0,
      }
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      let allCategories: Category[] = []
      let nextUrl: string | null = API_ENDPOINTS.PRODUCTS.CATEGORIES

      while (nextUrl) {
        const response: CategoryAPIResponse = await apiClient.get<CategoryAPIResponse>(nextUrl)
        allCategories = [...allCategories, ...(response.results || [])]
        nextUrl = response.next
      }

      return allCategories
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      // Backend doesn't have featured endpoint yet
      // Return first 6 products from page 1 (backend returns 100 per page)
      const response = await productService.getProducts({ page: 1 })
      return response.products.slice(0, 6)
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
      return []
    }
  },
}
