import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Product,
  ProductListResponse,
  ProductSearchParams,
  Category,
} from '@features/products/types'
import type { ProductAPI, PaginatedProductsAPI } from '@features/products/types/api'
import { transformProductFromAPI } from '@features/products/types/api'

export const productService = {
  /**
   * Get products from backend API
   * Backend returns paginated response with count, next, previous, results
   */
  getProducts: async (params?: ProductSearchParams): Promise<ProductListResponse> => {
    try {
      const page = params?.page || 1
      const limit = params?.limit || 12

      // Fetch products from backend with pagination
      const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.PRODUCTS.LIST, {
        params: {
          page,
          page_size: limit, // Django REST Framework uses page_size
        },
      })

      // Transform backend products to frontend format
      const products: Product[] = response.results.map(transformProductFromAPI)

      return {
        products,
        total: response.count,
        page,
        limit,
        totalPages: Math.ceil(response.count / limit),
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      // Return empty response on error
      return {
        products: [],
        total: 0,
        page: 1,
        limit: params?.limit || 12,
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
      // Backend doesn't have search endpoint yet, so we fetch all and filter on frontend
      // Fetch a large page to get all products for filtering
      const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.PRODUCTS.LIST, {
        params: {
          page: 1,
          page_size: 1000, // Get a large number of products
        },
      })

      // Transform and filter products
      const allProducts = response.results.map(transformProductFromAPI)
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
      // Backend doesn't have categories endpoint in the format we need
      // For now, extract unique categories from products
      const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.PRODUCTS.LIST, {
        params: {
          page: 1,
          page_size: 1000,
        },
      })

      const products = response.results.map(transformProductFromAPI)
      const categoriesMap = new Map<string, Category>()

      products.forEach((product) => {
        if (!categoriesMap.has(product.category.id)) {
          categoriesMap.set(product.category.id, product.category)
        }
      })

      return Array.from(categoriesMap.values())
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      // Backend doesn't have featured endpoint yet
      // Return first 6 products as featured
      const response = await productService.getProducts({ page: 1, limit: 6 })
      return response.products
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
      return []
    }
  },
}
