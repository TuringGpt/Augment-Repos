import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Product,
  ProductListResponse,
  ProductSearchParams,
  Category,
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
    return apiClient.get<Category[]>(API_ENDPOINTS.PRODUCTS.CATEGORIES)
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    return apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS.FEATURED)
  },
}
