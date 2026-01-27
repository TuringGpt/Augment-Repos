/**
 * Admin Reports Types
 * These types match the backend API response from /dashboard/statistics/general_statistics/
 */

/**
 * General statistics response from the backend
 * Response from /api/v1/dashboard/statistics/general_statistics/
 */
export interface GeneralStatisticsResponse {
  // Add the actual fields based on your backend response
  // This is a placeholder structure - update based on actual API response
  total_revenue?: number
  total_orders?: number
  total_customers?: number
  total_products?: number
  [key: string]: unknown
}

/**
 * Query parameters for general statistics endpoint
 */
export interface GeneralStatisticsParams {
  // Add any query parameters your endpoint accepts
  // For example:
  // days?: number
  // start_date?: string
  // end_date?: string
}

