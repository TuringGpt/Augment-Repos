/**
 * Admin Reports Types
 * These types match the backend API response from /dashboard/statistics/general_statistics/
 */

/**
 * General statistics response from the backend
 * Response from /api/v1/dashboard/statistics/general_statistics/
 */
export interface GeneralStatisticsResponse {
  total_products_tracked: number
  total_views: number
  total_cart_additions: number
  total_purchases: number
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

