import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Product,
  ProductListResponse,
  ProductSearchParams,
  Category,
  CategoryAPIResponse,
} from '@features/products/types'
import type { ProductAPI, PaginatedProductsAPI } from '@features/products/types/api'
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

  getProductById: async (id: string): Promise<Product> => {
    const apiProduct = await apiClient.get<ProductAPI>(API_ENDPOINTS.PRODUCTS.DETAIL(id))
    return transformProductFromAPI(apiProduct)
  },

  searchProducts: async (
    query: string,
    params?: ProductSearchParams
  ): Promise<ProductListResponse> => {
    try {
      // Backend doesn't have search endpoint yet, so we fetch all pages and filter on frontend
      // Note: Backend page_size is fixed at 100, so we need to fetch all pages
      let allProducts: Product[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore) {
        const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.PRODUCTS.LIST, {
          params: { page: currentPage },
        })

        const pageProducts = response.results.map(transformProductFromAPI)
        allProducts = [...allProducts, ...pageProducts]

        hasMore = response.next !== null
        currentPage++
      }

      // Filter products by query
      const filteredProducts = allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase())
      )

      // Apply pagination to filtered results
      const page = params?.page || 1
      const limit = params?.limit || 12
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      return {
        products: filteredProducts.slice(startIndex, endIndex),
        total: filteredProducts.length,
        page,
        limit,
        totalPages: Math.ceil(filteredProducts.length / limit),
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
