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
import type {
  PaginatedProductsAPI,
  ProductDetailAPI,
  RecommendedProductsAPI,
  UpdateProductRequest,
} from '@features/products/types/api'
import {
  transformProductFromAPI,
  transformCategoryFromAPI,
  transformBrandFromAPI,
  transformRecommendedProductFromAPI,
} from '@features/products/types/api'

export const productService = {
  /**
   * Get products from backend API
   * Backend returns paginated response with count, next, previous, results
   * Note: Backend has fixed page_size of 100 (configured in settings.py)
   * @throws Error if the API request fails
   */
  getProducts: async (params?: ProductSearchParams): Promise<ProductListResponse> => {
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

    // Add brand filter if provided (using brand name)
    if (params?.brandName) {
      queryParams.brand = params.brandName
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
        brandName: params?.brandName,
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

  /**
   * Search products by query string
   * @param query - Search query string
   * @param params - Optional search parameters (limit, etc.)
   * @throws Error if the API request fails
   */
  searchProducts: async (
    query: string,
    params?: ProductSearchParams
  ): Promise<ProductListResponse> => {
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
  },

  /**
   * Get all categories from backend API
   * Fetches all pages of categories using pagination
   * @throws Error if the API request fails
   */
  getCategories: async (): Promise<Category[]> => {
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
  },

  /**
   * Get all brands from backend API
   * Fetches all pages of brands using pagination
   * @throws Error if the API request fails
   */
  getBrands: async (): Promise<Brand[]> => {
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
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      // Fetch featured products from backend API
      // Backend returns paginated response with products where is_featured=True
      const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.PRODUCTS.FEATURED, {
        params: {
          page: 1,
        },
      })

      // Transform backend products to frontend format
      const products: Product[] = response.results.map(transformProductFromAPI)

      return products
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
      return []
    }
  },

  /**
   * Get recommended products from backend API
   * Backend returns paginated response with expanded brand and category objects
   * @param page - Page number (default: 1)
   * @throws Error if the API request fails
   */
  getRecommendedProducts: async (page: number = 1): Promise<ProductListResponse> => {
    const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings

    // Fetch recommended products from backend
    const response = await apiClient.get<RecommendedProductsAPI>(
      API_ENDPOINTS.PRODUCTS.RECOMMEND,
      {
        params: { page },
      }
    )

    console.log('🔍 Recommended Products API Response:', {
      count: response.count,
      resultsLength: response.results.length,
      next: response.next,
      previous: response.previous,
    })

    // Transform backend products to frontend format
    const products: Product[] = response.results.map(transformRecommendedProductFromAPI)

    return {
      products,
      total: response.count,
      page,
      limit: backendPageSize,
      totalPages: Math.ceil(response.count / backendPageSize),
    }
  },

  /**
   * Update a product by ID
   * @param id - Product ID to update
   * @param data - Partial product data to update
   * @returns Promise with updated product detail
   * @throws Error if the API request fails
   */
  updateProduct: async (id: string, data: UpdateProductRequest): Promise<ProductDetailAPI> => {
    // Convert price and rating to strings if they are numbers
    const requestData: UpdateProductRequest = {
      ...data,
      price: data.price !== undefined ? String(data.price) : undefined,
      rating: data.rating !== undefined ? String(data.rating) : undefined,
    }

    // Send PATCH request to update product
    const response = await apiClient.patch<ProductDetailAPI>(
      API_ENDPOINTS.PRODUCTS.UPDATE(id),
      requestData
    )
    return response
  },

  /**
   * Delete a product by ID
   * @param id - Product ID to delete
   * @throws Error if the API request fails
   */
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id))
  },
}
