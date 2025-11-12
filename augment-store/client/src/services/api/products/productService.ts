import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Product,
  ProductListResponse,
  ProductSearchParams,
  Category,
  CategoryAPIResponse,
  Brand,
  BrandAPIResponse,
} from '@features/products/types'
import type { PaginatedProductsAPI, ProductDetailAPI } from '@features/products/types/api'
import {
  transformProductFromAPI,
  transformCategoryFromAPI,
  transformBrandFromAPI,
} from '@features/products/types/api'

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

      // Build query params for backend API
      const queryParams: Record<string, number | string> = {
        page,
      }

      // Add category filter if provided (using slug)
      // TEMPORARY: Using slug generated from category name until backend exposes slug field
      if (params?.categorySlug) {
        queryParams.category = params.categorySlug
      }

      // Add rating filters if provided
      if (params?.minRating !== undefined && params?.minRating !== null) {
        queryParams.rating_min = params.minRating
      }
      if (params?.maxRating !== undefined && params?.maxRating !== null) {
        queryParams.rating_max = params.maxRating
      }

      // Add price filters if provided
      if (params?.minPrice !== undefined && params?.minPrice !== null) {
        queryParams.price_min = params.minPrice
      }
      if (params?.maxPrice !== undefined && params?.maxPrice !== null) {
        queryParams.price_max = params.maxPrice
      }

      // Fetch products from backend with pagination and filters
      const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.PRODUCTS.LIST, {
        params: queryParams,
      })

      console.log('🔍 Raw API Response:', {
        count: response.count,
        resultsLength: response.results.length,
        next: response.next,
        previous: response.previous,
        filters: {
          categorySlug: params?.categorySlug,
          minRating: params?.minRating,
          maxRating: params?.maxRating,
          minPrice: params?.minPrice,
          maxPrice: params?.maxPrice,
        },
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
      const limit = params?.limit || 12

      // Fetch products from backend using dedicated search endpoint
      // Backend supports limit parameter to restrict results
      const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.PRODUCTS.SEARCH, {
        params: {
          search: query,
          limit: limit,
        },
      })

      // Transform backend products to frontend format
      const products: Product[] = response.results.map(transformProductFromAPI)

      return {
        products,
        total: response.count,
        page: 1, // Search always returns first page only
        limit,
        totalPages: 1, // Search only shows first page
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
        // Transform backend categories to frontend format
        const transformedCategories = (response.results || []).map(transformCategoryFromAPI)
        allCategories = [...allCategories, ...transformedCategories]
        nextUrl = response.next
      }

      return allCategories
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }
  },

  getBrands: async (): Promise<Brand[]> => {
    try {
      let allBrands: Brand[] = []
      let nextUrl: string | null = API_ENDPOINTS.PRODUCTS.BRANDS

      while (nextUrl) {
        const response: BrandAPIResponse = await apiClient.get<BrandAPIResponse>(nextUrl)
        // Transform backend brands to frontend format
        const transformedBrands = (response.results || []).map(transformBrandFromAPI)
        allBrands = [...allBrands, ...transformedBrands]
        nextUrl = response.next
      }

      return allBrands
    } catch (error) {
      console.error('Failed to fetch brands:', error)
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
