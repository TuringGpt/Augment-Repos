import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { AdminAnalyticsOverviewResponse } from '@features/admin-dashboard/types'

export const adminDashboardService = {
  /**
   * Get analytics overview for the admin dashboard
   * 
   * @param days - Number of days to look back (default: 30, max: 365)
   * @returns Promise with analytics overview data
   */
  getAnalyticsOverview: async (days: number = 30): Promise<AdminAnalyticsOverviewResponse> => {
    try {
      // Validate days parameter
      const validDays = Math.max(1, Math.min(365, days))

      const response = await apiClient.get<AdminAnalyticsOverviewResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.ANALYTICS_OVERVIEW,
        {
          params: { days: validDays },
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch admin analytics overview:', error)
      throw error
    }
  },
}

