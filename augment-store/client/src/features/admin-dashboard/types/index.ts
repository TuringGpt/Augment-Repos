/**
 * Admin Dashboard Analytics Types
 * These types match the backend API response from /dashboard/statistics/analytics_overview/
 */

/**
 * Overview metrics for the admin dashboard
 */
export interface AdminDashboardOverview {
  total_revenue: number
  total_orders: number
  completed_orders: number
  average_order_value: number
  total_products: number
  total_categories: number
  new_customers: number
}

/**
 * Conversion funnel metrics
 */
export interface ConversionFunnel {
  total_views: number
  total_cart_additions: number
  total_purchases: number
  view_to_cart_rate: number
  cart_to_purchase_rate: number
  overall_conversion_rate: number
}

/**
 * Cart abandonment metrics
 */
export interface CartAbandonmentMetrics {
  total_abandonments: number
  abandonment_rate: number
}

/**
 * Top product by revenue
 */
export interface TopProductByRevenue {
  product_id: string
  product_name: string
  revenue: number
  units_sold: number
  price: number
}

/**
 * Category performance metrics
 */
export interface CategoryPerformance {
  category_name: string
  revenue: number
  units_sold: number
  orders: number
}

/**
 * Complete analytics overview response from the backend
 */
export interface AdminAnalyticsOverviewResponse {
  period_days: number
  overview: AdminDashboardOverview
  conversion_funnel: ConversionFunnel
  cart_abandonment: CartAbandonmentMetrics
  top_products_by_revenue: TopProductByRevenue[]
  category_performance: CategoryPerformance[]
}

