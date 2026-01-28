import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  CustomerRetentionResponse,
  CustomerRetentionParams,
  CustomerSegmentsResponse,
  CustomerSegmentsParams,
  NewVsReturningResponse,
  NewVsReturningParams,
  CustomerPurchaseBehaviorResponse,
  CustomerPurchaseBehaviorParams,
  ChurnRiskResponse,
  ChurnRiskParams,
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
      // Convert to integer first to match backend's int(value) behavior
      const validatedParams = params?.days !== undefined
        ? {
            days: Number.isFinite(params.days)
              ? Math.floor(Math.max(1, Math.min(3650, params.days)))
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
      // Convert to integer first to match backend's int(value) behavior
      const validatedParams = params?.days !== undefined
        ? {
            days: Number.isFinite(params.days)
              ? Math.floor(Math.max(1, Math.min(3650, params.days)))
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
      // Backend expects days as query parameter (max: 365 per backend validation)
      // Use explicit undefined check to avoid treating 0 as falsy (0 should be clamped to 1)
      // Convert to integer first to match backend's int(value) behavior
      const validatedParams = params?.days !== undefined
        ? {
            days: Number.isFinite(params.days)
              ? Math.floor(Math.max(1, Math.min(365, params.days)))
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

  /**
   * Get customer purchase behavior analysis
   *
   * @param params - Query parameters (days, limit)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with customer purchase behavior data
   */
  getCustomerPurchaseBehavior: async (
    params?: CustomerPurchaseBehaviorParams,
    signal?: AbortSignal
  ): Promise<CustomerPurchaseBehaviorResponse> => {
    try {
      // Validate parameters if provided - ensure they're finite numbers before clamping
      // Backend expects days (max: 365) and limit (max: 100) as query parameters
      // Use explicit undefined check to avoid treating 0 as falsy
      const validatedParams: { days?: number; limit?: number } = {}

      if (params?.days !== undefined) {
        // Convert to integer first to match backend's int(value) behavior
        validatedParams.days = Number.isFinite(params.days)
          ? Math.floor(Math.max(1, Math.min(365, params.days)))
          : undefined
      }

      if (params?.limit !== undefined) {
        // Convert to integer first to match backend's int(value) behavior
        validatedParams.limit = Number.isFinite(params.limit)
          ? Math.floor(Math.max(1, Math.min(100, params.limit)))
          : undefined
      }

      // Filter out undefined values to avoid sending empty query params like "days=" or "limit="
      const filteredParams = Object.fromEntries(
        Object.entries(validatedParams).filter(([_, value]) => value !== undefined)
      )

      // Backend uses GET method with days and limit as query parameters
      const response = await apiClient.get<CustomerPurchaseBehaviorResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.CUSTOMER_PURCHASE_BEHAVIOR,
        {
          params: Object.keys(filteredParams).length > 0 ? filteredParams : undefined,
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch customer purchase behavior:', error)
      throw error
    }
  },

  /**
   * Get customers at risk of churning based on inactivity
   *
   * @param params - Query parameters (limit, inactive_days)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with churn risk data
   */
  getChurnRisk: async (
    params?: ChurnRiskParams,
    signal?: AbortSignal
  ): Promise<ChurnRiskResponse> => {
    try {
      // Validate parameters if provided - ensure they're finite numbers before clamping
      // Backend expects limit (max: 100) and inactive_days (max: 365) as query parameters
      // Use explicit undefined check to avoid treating 0 as falsy
      const validatedParams: { limit?: number; inactive_days?: number } = {}

      if (params?.limit !== undefined) {
        // Convert to integer first to match backend's int(value) behavior
        validatedParams.limit = Number.isFinite(params.limit)
          ? Math.floor(Math.max(1, Math.min(100, params.limit)))
          : undefined
      }

      if (params?.inactive_days !== undefined) {
        // Convert to integer first to match backend's int(value) behavior
        validatedParams.inactive_days = Number.isFinite(params.inactive_days)
          ? Math.floor(Math.max(1, Math.min(365, params.inactive_days)))
          : undefined
      }

      // Filter out undefined values to avoid sending empty query params like "limit=" or "inactive_days="
      const filteredParams = Object.fromEntries(
        Object.entries(validatedParams).filter(([_, value]) => value !== undefined)
      )

      // Backend uses GET method with limit and inactive_days as query parameters
      const response = await apiClient.get<ChurnRiskResponse>(
        API_ENDPOINTS.ADMIN_DASHBOARD.CHURN_RISK,
        {
          params: Object.keys(filteredParams).length > 0 ? filteredParams : undefined,
          signal,
        }
      )

      return response
    } catch (error) {
      console.error('Failed to fetch churn risk data:', error)
      throw error
    }
  },
}

