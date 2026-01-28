import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { GeneralStatisticsResponse } from '@features/admin-reports/types'
import { sanitizeErrorForLogging } from '@utils/errorUtils'

export const adminReportService = {
  /**
   * Get general statistics for admin reports
   *
   * Note: This endpoint does not accept any query parameters.
   * It returns all-time aggregated statistics across all products.
   *
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with general statistics data
   */
  getGeneralStatistics: async (
    signal?: AbortSignal
  ): Promise<GeneralStatisticsResponse> => {
    try {
      const response = await apiClient.get<GeneralStatisticsResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.GENERAL_STATISTICS,
        {
          signal,
        }
      )

      return response
    } catch (error) {
      // Log only sanitized error information to avoid leaking sensitive data
      // (e.g., Authorization headers in Axios config)
      console.error('Failed to fetch general statistics:', sanitizeErrorForLogging(error))
      throw error
    }
  },
}

