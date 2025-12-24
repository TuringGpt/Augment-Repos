/**
 * Product Statistics Types
 * These types match the backend API response from /dashboard/statistics/
 */

/**
 * Product statistics item from the backend
 */
export interface ProductStatisticsItem {
  product_id: string
  product_name: string
  product_price: string
  view_count: number
  cart_add_count: number
  cart_remove_count: number
  purchase_count: number
}

/**
 * Response from /api/v1/dashboard/statistics/ (paginated list)
 */
export interface ProductStatisticsResponse {
  count: number
  next: string | null
  previous: string | null
  results: ProductStatisticsItem[]
}

/**
 * Query parameters for product statistics endpoint
 */
export interface ProductStatisticsParams {
  page?: number
  page_size?: number
}

/**
 * Single product statistics response (non-paginated)
 * Response from /api/v1/dashboard/statistics/{id}/
 */
export type ProductStatisticsDetail = ProductStatisticsItem

