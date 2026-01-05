import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  CustomerRetentionResponse,
  CustomerRetentionParams,
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
}

