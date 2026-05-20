import { create } from 'zustand'
import type { GeneralStatisticsResponse, HealthCheckResponse } from '@features/admin-reports/types'

// Request counter to prevent race conditions when fetching general statistics
// When multiple fetch calls are made in quick succession,
// only the most recent request should update the state
let fetchGeneralStatisticsRequestCounter = 0

// Request counter to prevent race conditions when fetching health check
let fetchHealthCheckRequestCounter = 0

interface AdminReportsState {
  // General statistics data
  generalStatistics: GeneralStatisticsResponse | null

  // Health check data
  healthCheck: HealthCheckResponse | null

  // Loading states
  isLoading: boolean
  isHealthCheckLoading: boolean

  // Error states
  error: string | null
  healthCheckError: string | null

  // Actions
  fetchGeneralStatistics: (signal?: AbortSignal) => Promise<GeneralStatisticsResponse | null>
  fetchHealthCheck: (signal?: AbortSignal) => Promise<HealthCheckResponse | null>
  clearGeneralStatistics: () => void
  clearHealthCheck: () => void
  clearError: () => void
  clearHealthCheckError: () => void
}

export const useAdminReportsStore = create<AdminReportsState>((set) => ({
  // Initial state
  generalStatistics: null,
  healthCheck: null,
  isLoading: false,
  isHealthCheckLoading: false,
  error: null,
  healthCheckError: null,

  // Actions
  fetchGeneralStatistics: async (signal?: AbortSignal) => {
    // Increment counter to track this request BEFORE the dynamic import
    // This prevents race conditions when multiple calls are made rapidly
    // If we increment after the import, the order of increments may not match the order requests were initiated
    fetchGeneralStatisticsRequestCounter += 1
    const currentRequestId = fetchGeneralStatisticsRequestCounter

    try {
      // Import adminReportService dynamically to avoid circular dependency
      // This is inside the try block to ensure import failures are handled properly
      const { adminReportService } = await import('@services/api/admin-reports/adminReportService')

      // Only update loading state if this is still the most recent request
      if (currentRequestId === fetchGeneralStatisticsRequestCounter) {
        set({ isLoading: true, error: null })
      }

      const data = await adminReportService.getGeneralStatistics(signal)

      // Only update state if this is still the most recent request and not aborted
      if (currentRequestId === fetchGeneralStatisticsRequestCounter && !signal?.aborted) {
        set({ generalStatistics: data })
        return data
      }

      // Return null if request was superseded or aborted to prevent callers from acting on stale/canceled results
      return null
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts or new request starts
      const error = err as {
        name?: string
        response?: { status?: number; statusText?: string; data?: { message?: string } }
        message?: string
      }

      // Don't update state for aborted requests - swallow the error to prevent unhandled promise rejections
      if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
        // Reset loading state if this is still the most recent request to prevent UI from getting stuck
        if (currentRequestId === fetchGeneralStatisticsRequestCounter) {
          set({ isLoading: false })
        }
        return null
      }

      // Don't update error state or rethrow if this request has been superseded
      // Treat superseded-request failures similarly to cancellations to prevent unhandled promise rejections
      // when callers use fire-and-forget patterns (e.g., in useEffect)
      if (currentRequestId !== fetchGeneralStatisticsRequestCounter) {
        return null
      }

      // Handle different error types
      let errorMessage = 'Failed to fetch general statistics'

      if (error?.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.'
      } else if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to view this data.'
      } else if (error?.response?.status === 404) {
        errorMessage = 'Statistics endpoint not found.'
      } else if (error?.response?.status && error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }

      set({ error: errorMessage })
      // Log only sanitized error information to avoid leaking sensitive data
      // (e.g., Authorization headers in Axios config)
      console.error('Error fetching general statistics:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        message: errorMessage,
        errorName: error?.name,
      })

      // Return null after setting error state to align with other fetch* actions in this repo
      // This prevents unhandled promise rejections when callers use fire-and-forget patterns (e.g., in useEffect)
      return null
    } finally {
      // Only update loading state if this is still the most recent request
      if (currentRequestId === fetchGeneralStatisticsRequestCounter) {
        set({ isLoading: false })
      }
    }
  },

  clearGeneralStatistics: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchGeneralStatisticsRequestCounter += 1
    set({
      generalStatistics: null,
      error: null,
      isLoading: false,
    })
  },

  clearError: () => set({ error: null }),

  fetchHealthCheck: async (signal?: AbortSignal) => {
    // Increment counter to track this request BEFORE the dynamic import
    // This prevents race conditions when multiple calls are made rapidly
    fetchHealthCheckRequestCounter += 1
    const currentRequestId = fetchHealthCheckRequestCounter

    // Set loading state and clear errors synchronously at request start
    // This ensures admins don't see stale cached health status before the loading flag flips
    set({ isHealthCheckLoading: true, healthCheckError: null })

    try {
      // Import adminReportService dynamically to avoid circular dependency
      const { adminReportService } = await import('@services/api/admin-reports/adminReportService')

      const data = await adminReportService.getHealthCheck(signal)

      // Only update state if this is still the most recent request and not aborted
      if (currentRequestId === fetchHealthCheckRequestCounter && !signal?.aborted) {
        set({ healthCheck: data })
        return data
      }

      // Return null if request was superseded or aborted
      return null
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts or new request starts
      const error = err as {
        name?: string
        response?: { status?: number; statusText?: string; data?: { message?: string } }
        message?: string
      }

      // Don't update state for aborted requests
      if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
        // Reset loading state if this is still the most recent request
        if (currentRequestId === fetchHealthCheckRequestCounter) {
          set({ isHealthCheckLoading: false })
        }
        return null
      }

      // Don't update error state if this request has been superseded
      if (currentRequestId !== fetchHealthCheckRequestCounter) {
        return null
      }

      // Handle different error types
      let errorMessage = 'Failed to fetch health check'

      if (error?.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.'
      } else if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to view this data.'
      } else if (error?.response?.status === 404) {
        errorMessage = 'Health check endpoint not found.'
      } else if (error?.response?.status && error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }

      set({ healthCheckError: errorMessage })
      console.error('Error fetching health check:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        message: errorMessage,
        errorName: error?.name,
      })

      return null
    } finally {
      // Only update loading state if this is still the most recent request
      if (currentRequestId === fetchHealthCheckRequestCounter) {
        set({ isHealthCheckLoading: false })
      }
    }
  },

  clearHealthCheck: () => {
    // Increment counter to invalidate any in-flight fetch requests
    fetchHealthCheckRequestCounter += 1
    set({
      healthCheck: null,
      healthCheckError: null,
      isHealthCheckLoading: false,
    })
  },

  clearHealthCheckError: () => set({ healthCheckError: null }),
}))

