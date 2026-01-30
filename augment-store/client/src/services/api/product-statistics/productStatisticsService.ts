import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  ProductStatisticsResponse,
  ProductStatisticsParams,
  BestSellingProductsResponse,
  BestSellingProductsParams,
  MostViewedProductsResponse,
  MostViewedProductsParams,
  MostAddedToCartProductsResponse,
  MostAddedToCartProductsParams,
  ProductStatisticsDetail,
  ProductPerformanceResponse,
  ProductPerformanceParams,
} from '@features/product-statistics/types'

export const productStatisticsService = {
  /**
   * Get product statistics (paginated list)
   *
   * @param params - Query parameters (page, page_size, search)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with product statistics data
   */
  getProductStatistics: async (
    params?: ProductStatisticsParams,
    signal?: AbortSignal
  ): Promise<ProductStatisticsResponse> => {
    try {
      const response = await apiClient.get<ProductStatisticsResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.PRODUCT_STATISTICS,
        {
          params,
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch product statistics:', error)
      throw error
    }
  },
    
  /**
   * Get product statistics by product ID
   *
   * @param id - Product ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with product statistics data for a specific product
   */
  getProductStatisticsById: async (
    id: string,
    signal?: AbortSignal
  ): Promise<ProductStatisticsDetail> => {
    try {
      const response = await apiClient.get<ProductStatisticsDetail>(
        API_ENDPOINTS.ADMIN_DASHBOARD.PRODUCT_STATISTICS_BY_ID(id),
        {
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch product statistics by ID:', error)
      throw error
    }
  },

  /**
   * Get best selling products (highest purchase count)
   *
   * @param params - Query parameters (limit)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with best selling products data
   */
  getBestSellingProducts: async (
    params?: BestSellingProductsParams,
    signal?: AbortSignal
  ): Promise<BestSellingProductsResponse> => {
    try {
      const response = await apiClient.get<BestSellingProductsResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.BEST_SELLING_PRODUCTS,
        {
          params,
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch best selling products:', error)
      throw error
    }
  },

  /**
   * Get most viewed products (highest view count)
   *
   * @param params - Query parameters (limit)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with most viewed products data
   */
  getMostViewedProducts: async (
    params?: MostViewedProductsParams,
    signal?: AbortSignal
  ): Promise<MostViewedProductsResponse> => {
    try {
      const response = await apiClient.get<MostViewedProductsResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.MOST_VIEWED_PRODUCTS,
        {
          params,
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch most viewed products:', error)
      throw error
    }
  },

  /**
   * Get most added to cart products (highest cart add count)
   *
   * @param params - Query parameters (limit)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with most added to cart products data
   */
  getMostAddedToCartProducts: async (
    params?: MostAddedToCartProductsParams,
    signal?: AbortSignal
  ): Promise<MostAddedToCartProductsResponse> => {
    try {
      const response = await apiClient.get<MostAddedToCartProductsResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.MOST_ADDED_TO_CART,
        {
          params,
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch most added to cart products:', error)
      throw error
    }
  },

  /**
   * Get product performance metrics
   * Returns categorized lists of products based on performance:
   * - Low performing products (low views and purchases)
   * - High abandonment products (high cart adds but low purchases)
   * - Low conversion products (high views but low purchases)
   * - High engagement products (high views and cart adds)
   *
   * @param params - Query parameters (days, limit)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with product performance data
   */
  getProductPerformance: async (
    params?: ProductPerformanceParams,
    signal?: AbortSignal
  ): Promise<ProductPerformanceResponse> => {
    try {
      const response = await apiClient.get<ProductPerformanceResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.PRODUCT_PERFORMANCE,
        {
          params,
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch product performance:', error)
      throw error
    }
  },
}

