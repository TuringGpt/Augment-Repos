/**
 * Admin Reports Types
 * These types match the backend API response from /dashboard/statistics/general_statistics/
 */

/**
 * General statistics response from the backend
 * Endpoint: /dashboard/statistics/general_statistics/
 * (Combined with API_CONFIG.BASE_URL to form the full path)
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

