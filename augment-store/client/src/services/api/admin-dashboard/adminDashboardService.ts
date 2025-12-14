import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { AdminAnalyticsOverviewResponse } from '@features/admin-dashboard/types'

export const adminDashboardService = {
  /**
   * Get analytics overview for the admin dashboard
   *
   * @param days - Number of days to look back (default: 30, max: 365)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with analytics overview data
   */
  getAnalyticsOverview: async (
    days: number = 30,
    signal?: AbortSignal
  ): Promise<AdminAnalyticsOverviewResponse> => {
    try {
      // Validate days parameter - ensure it's a finite number before clamping
      const validDays = Number.isFinite(days) ? Math.max(1, Math.min(365, days)) : 30

      const response = await apiClient.get<AdminAnalyticsOverviewResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.ANALYTICS_OVERVIEW,
        {
          params: { days: validDays },
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch admin analytics overview:', error)
      throw error
    }
  },
}

