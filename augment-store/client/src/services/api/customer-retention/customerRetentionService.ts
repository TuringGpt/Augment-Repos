import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  CustomerRetentionResponse,
  CustomerRetentionParams,
} from '@features/customer-retention/types'

export const customerRetentionService = {
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
      const validatedParams = params?.days
        ? {
            days: Number.isFinite(params.days)
              ? Math.max(1, Math.min(365, params.days))
              : undefined,
          }
        : undefined

      const response = await apiClient.post<CustomerRetentionResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.CUSTOMER_RETENTION,
        validatedParams,
        {
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

