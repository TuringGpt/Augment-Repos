import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Product,
  ProductListResponse,
  ProductSearchParams,
  Category,
} from '@features/products/types'
import type { ProductAPI } from '@features/products/types/api'
import { transformProductFromAPI } from '@features/products/types/api'

export const productService = {
  /**
   * Get products from backend API
   * Backend returns array of products without pagination metadata
   * We implement pagination on the frontend
   */
  getProducts: async (params?: ProductSearchParams): Promise<ProductListResponse> => {
    try {
      // Fetch all products from backend
      const apiProducts = await apiClient.get<ProductAPI[]>(API_ENDPOINTS.PRODUCTS.LIST)

      // Transform backend products to frontend format
      const products: Product[] = apiProducts.map(transformProductFromAPI)

      // Implement frontend pagination
      const page = params?.page || 1
      const limit = params?.limit || 12
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      const paginatedProducts = products.slice(startIndex, endIndex)

      return {
        products: paginatedProducts,
        total: products.length,
        page,
        limit,
        totalPages: Math.ceil(products.length / limit),
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
    // Backend doesn't have search endpoint yet, so we fetch all and filter on frontend
    const allProductsResponse = await productService.getProducts({ ...params, limit: 1000 })

    const filteredProducts = allProductsResponse.products.filter(
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
  },

  getCategories: async (): Promise<Category[]> => {
    // Backend doesn't have categories endpoint in the format we need
    // For now, extract unique categories from products
    const allProductsResponse = await productService.getProducts({ limit: 1000 })
    const categoriesMap = new Map<string, Category>()

    allProductsResponse.products.forEach((product) => {
      if (!categoriesMap.has(product.category.id)) {
        categoriesMap.set(product.category.id, product.category)
      }
    })

    return Array.from(categoriesMap.values())
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    // Backend doesn't have featured endpoint yet
    // Return first 6 products as featured
    const response = await productService.getProducts({ limit: 6 })
    return response.products
  },
}
