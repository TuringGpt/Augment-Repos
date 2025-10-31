import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Product,
  ProductListResponse,
  ProductSearchParams,
  Category,
  CategoryAPIResponse,
} from '@features/products/types'

export const productService = {
  getProducts: async (params?: ProductSearchParams): Promise<ProductListResponse> => {
    return apiClient.get<ProductListResponse>(API_ENDPOINTS.PRODUCTS.LIST, { params })
  },

  getProductById: async (id: string): Promise<Product> => {
    return apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.DETAIL(id))
  },

  searchProducts: async (
    query: string,
    params?: ProductSearchParams
  ): Promise<ProductListResponse> => {
    return apiClient.get<ProductListResponse>(API_ENDPOINTS.PRODUCTS.SEARCH, {
      params: { q: query, ...params },
    })
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
    return apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS.FEATURED)
  },
}
