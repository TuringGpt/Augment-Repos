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
 * Response from /api/v1/dashboard/statistics/best_selling/ endpoint
 */
export interface BestSellingProductsResponse {
  count: number
  results: ProductStatisticsItem[]
  metric: string
}

/**
 * Query parameters for best selling products endpoint
 */
export interface BestSellingProductsParams {
  limit?: number
}

/**
 * Single product statistics response (non-paginated)
 * Response from /api/v1/dashboard/statistics/{id}/
 */
export type ProductStatisticsDetail = ProductStatisticsItem

/**
 * Low performing product item
 * Products with lowest purchase count within the period
 */
export interface LowPerformingProductItem {
  product_id: string
  product_name: string
  view_count: number
  cart_add_count: number
  purchase_count: number
  view_to_purchase_ratio: number
  cart_to_purchase_ratio: number
}

/**
 * High abandonment product item
 * Products with highest cart abandonment rate within the period
 */
export interface HighAbandonmentProductItem {
  product_id: string
  product_name: string
  cart_add_count: number
  abandonment_count: number
  abandonment_rate: number
}

/**
 * Low conversion product item
 * Products with lowest conversion rate within the period
 */
export interface LowConversionProductItem {
  product_id: string
  product_name: string
  view_count: number
  purchase_count: number
  conversion_rate: number
}

/**
 * High engagement product item
 * Products with highest view-to-purchase ratio within the period
 */
export interface HighEngagementProductItem {
  product_id: string
  product_name: string
  view_count: number
  purchase_count: number
  engagement_ratio: number
}

/**
 * Product performance response from /api/v1/dashboard/statistics/product_performance/
 * Returns categorized lists of products based on performance metrics
 * All metrics are calculated based on data from the last N days (specified by period_days)
 */
export interface ProductPerformanceResponse {
  period_days: number
  low_performing_products: LowPerformingProductItem[]
  high_abandonment_products: HighAbandonmentProductItem[]
  low_conversion_products: LowConversionProductItem[]
  high_engagement_products: HighEngagementProductItem[]
}

/**
 * Query parameters for product performance endpoint
 */
export interface ProductPerformanceParams {
  days?: number
  limit?: number
}

