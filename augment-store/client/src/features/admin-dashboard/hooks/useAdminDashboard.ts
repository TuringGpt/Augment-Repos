import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)
  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchAnalytics = useCallback(async () => {
    // Cancel any in-flight request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsLoading(true)
        setError(null)
      }

      const data = await adminDashboardService.getAnalyticsOverview(days, abortController.signal)

      // Only update state if component is still mounted and request wasn't aborted
      if (isMountedRef.current && !abortController.signal.aborted) {
        setAnalytics(data)
      }
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts or new request starts
      const error = err as { name?: string; response?: { status?: number; data?: { message?: string } }; message?: string }

      if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
        console.log('Analytics request was cancelled')
        return
      }

      // Only update error state if component is still mounted
      if (!isMountedRef.current) {
        return
      }

      // Extract meaningful error message
      let errorMessage = 'Failed to fetch admin analytics data'

      if (error?.response?.status === 404) {
        errorMessage =
          'Analytics endpoint not found. Please ensure the backend API is running and the endpoint exists.'
      } else if (error?.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view analytics.'
      } else if (error?.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.'
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      console.error('Error fetching admin dashboard analytics:', {
        error,
        status: error?.response?.status,
        data: error?.response?.data,
        message: errorMessage,
      })
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [days])

  // Fetch analytics when autoFetch or days changes
  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics()
    }

    // Cleanup: abort in-flight requests when dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, days])

  // Track mounted state - only runs on mount and unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  }
}
