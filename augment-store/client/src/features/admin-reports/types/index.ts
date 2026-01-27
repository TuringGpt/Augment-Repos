/**
 * Admin Reports Types
 * These types match the backend API response from /dashboard/statistics/general_statistics/
 */

/**
 * General statistics response from the backend
 * Response from /api/v1/dashboard/statistics/general_statistics/
 *
 * Note: This endpoint does not accept any query parameters.
 * It returns all-time aggregated statistics across all products.
 */
export interface GeneralStatisticsResponse {
  total_products_tracked: number
  total_views: number
  total_cart_additions: number
  total_purchases: number
}

