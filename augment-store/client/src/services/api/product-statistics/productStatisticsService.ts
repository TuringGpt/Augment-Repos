import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  ProductStatisticsResponse,
  ProductStatisticsParams,
} from '@features/product-statistics/types'

export const productStatisticsService = {
  /**
   * Get product statistics (paginated list)
   *
   * @param params - Query parameters (page, page_size)
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
}

