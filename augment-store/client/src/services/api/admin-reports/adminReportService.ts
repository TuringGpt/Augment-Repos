import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  GeneralStatisticsResponse,
  GeneralStatisticsParams,
} from '@features/admin-reports/types'

export const adminReportService = {
  /**
   * Get general statistics for admin reports
   *
   * @param params - Query parameters (optional)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with general statistics data
   */
  getGeneralStatistics: async (
    params?: GeneralStatisticsParams,
    signal?: AbortSignal
  ): Promise<GeneralStatisticsResponse> => {
    try {
      const response = await apiClient.get<GeneralStatisticsResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.GENERAL_STATISTICS,
        {
          params,
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch general statistics:', error)
      throw error
    }
  },
}

