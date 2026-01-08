import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  CustomerRetentionResponse,
  CustomerRetentionParams,
  CustomerSegmentsResponse,
  CustomerSegmentsParams,
  NewVsReturningResponse,
  NewVsReturningParams,
} from '@features/customer-retention/types'

export const customerStatisticsService = {
  /**
   * Get customer retention statistics
   *
   * @param params - Query parameters (days)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with customer retention data
   */
  getCustomerRetention: async (
    params?: CustomerRetentionParams,
    signal?: AbortSignal
  ): Promise<CustomerRetentionResponse> => {
    try {
      // Validate days parameter if provided - ensure it's a finite number before clamping
      // Backend expects days as query parameter (max: 3650 per backend validation)
      // Use explicit undefined check to avoid treating 0 as falsy (0 should be clamped to 1)
      const validatedParams = params?.days !== undefined
        ? {
            days: Number.isFinite(params.days)
              ? Math.max(1, Math.min(3650, params.days))
              : undefined,
          }
        : undefined

      // Backend uses POST method but reads 'days' from query params, not request body
      const response = await apiClient.post<CustomerRetentionResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.CUSTOMER_RETENTION,
        {}, // Empty body - backend doesn't read from request body
        {
          params: validatedParams, // Send as query parameters
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch customer retention statistics:', error)
      throw error
    }
  },

  /**
   * Get customer segmentation by behavior patterns
   *
   * @param params - Query parameters (days)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with customer segments data
   */
  getCustomerSegments: async (
    params?: CustomerSegmentsParams,
    signal?: AbortSignal
  ): Promise<CustomerSegmentsResponse> => {
    try {
      // Validate days parameter if provided - ensure it's a finite number before clamping
      // Backend expects days as query parameter (max: 3650 per backend validation)
      // Use explicit undefined check to avoid treating 0 as falsy (0 should be clamped to 1)
      const validatedParams = params?.days !== undefined
        ? {
            days: Number.isFinite(params.days)
              ? Math.max(1, Math.min(3650, params.days))
              : undefined,
          }
        : undefined

      // Backend uses GET method with days as query parameter
      const response = await apiClient.get<CustomerSegmentsResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.CUSTOMER_SEGMENTS,
        {
          params: validatedParams, // Send as query parameters
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch customer segments:', error)
      throw error
    }
  },

  /**
   * Get new vs returning customers statistics
   *
   * @param params - Query parameters (days)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with new vs returning customers data
   */
  getNewVsReturning: async (
    params?: NewVsReturningParams,
    signal?: AbortSignal
  ): Promise<NewVsReturningResponse> => {
    try {
      // Validate days parameter if provided - ensure it's a finite number before clamping
      // Backend expects days as query parameter (max: 3650 per backend validation)
      // Use explicit undefined check to avoid treating 0 as falsy (0 should be clamped to 1)
      const validatedParams = params?.days !== undefined
        ? {
            days: Number.isFinite(params.days)
              ? Math.max(1, Math.min(3650, params.days))
              : undefined,
          }
        : undefined

      // Backend uses GET method with days as query parameter
      const response = await apiClient.get<NewVsReturningResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.NEW_VS_RETURNING,
        {
          params: validatedParams, // Send as query parameters
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch new vs returning customers:', error)
      throw error
    }
  },
}

