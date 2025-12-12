import { useState, useEffect, useCallback } from 'react'
import { adminDashboardService } from '@services/api'
import type { AdminAnalyticsOverviewResponse } from '@features/admin-dashboard/types'

interface UseAdminDashboardOptions {
  days?: number
  autoFetch?: boolean
}

interface UseAdminDashboardReturn {
  analytics: AdminAnalyticsOverviewResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for fetching and managing admin dashboard analytics data
 *
 * @param options - Configuration options
 * @param options.days - Number of days to look back (default: 30, max: 365)
 * @param options.autoFetch - Whether to automatically fetch data on mount (default: true)
 * @returns Admin dashboard analytics data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { analytics, isLoading, error, refetch } = useAdminDashboard({ days: 30 })
 *
 * if (isLoading) return <CircularProgress />
 * if (error) return <Alert severity="error">{error}</Alert>
 * if (!analytics) return null
 *
 * return <div>Revenue: ${analytics.overview.total_revenue}</div>
 * ```
 */
export function useAdminDashboard(options: UseAdminDashboardOptions = {}): UseAdminDashboardReturn {
  const { days = 30, autoFetch = true } = options

  const [analytics, setAnalytics] = useState<AdminAnalyticsOverviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await adminDashboardService.getAnalyticsOverview(days)

      setAnalytics(data)
    } catch (err: any) {
      // Extract meaningful error message
      let errorMessage = 'Failed to fetch admin analytics data'

      if (err?.response?.status === 404) {
        errorMessage =
          'Analytics endpoint not found. Please ensure the backend API is running and the endpoint exists.'
      } else if (err?.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view analytics.'
      } else if (err?.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.'
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      console.error('Error fetching admin dashboard analytics:', {
        error: err,
        status: err?.response?.status,
        data: err?.response?.data,
        message: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }, [days])

  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, days])

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  }
}
