/**
 * Customer Retention Types
 * These types match the backend API response from /dashboard/statistics/customer_retention/
 */

/**
 * Customer cohort analysis by month
 * Represents a cohort of customers who made their first purchase in a specific month
 */
export interface CustomerCohort {
  /** Month of first purchase in YYYY-MM format (e.g., "2024-01") */
  cohort_month: string
  /** Total number of customers in this cohort */
  customers: number
  /** Number of customers who made repeat purchases */
  repeat_customers: number
  /** Percentage of customers who made repeat purchases */
  retention_rate: number
}

/**
 * Complete customer retention response from the backend
 * Response from /api/v1/dashboard/statistics/customer_retention/
 *
 * Backend endpoint: POST /dashboard/statistics/customer_retention/
 * Query params: days (default: 365, max: 3650)
 */
export interface CustomerRetentionResponse {
  /** Number of days included in the analysis */
  period_days: number
  /** Total customers who made at least one purchase in the period */
  total_customers: number
  /** Count of customers with 2 or more orders */
  customers_with_multiple_orders: number
  /** Percentage of customers who made repeat purchases */
  repeat_purchase_rate: number
  /** Average time in days between orders for repeat customers */
  average_days_between_purchases: number
  /** Monthly cohort breakdown with retention rates */
  cohort_analysis: CustomerCohort[]
}

/**
 * Query parameters for customer retention endpoint
 */
export interface CustomerRetentionParams {
  /** Number of days to look back (default: 365, max: 3650) */
  days?: number
}

/**
 * Customer Segments Types
 * These types match the backend API response from /dashboard/statistics/customer_segments/
 */

/**
 * Base segment data for revenue-based segments
 */
export interface RevenueSegment {
  /** Number of customers in this segment */
  count: number
  /** Percentage of total customers in this segment */
  percentage: number
  /** Total revenue from this segment within the period */
  total_revenue: number
  /** Average order value for this segment within the period */
  avg_order_value: number
}

/**
 * Base segment data for recency-based segments (at-risk and churned)
 */
export interface RecencySegment {
  /** Number of customers in this segment */
  count: number
  /** Percentage of total customers in this segment */
  percentage: number
  /** Average days since last purchase */
  last_purchase_avg_days: number
}

/**
 * All customer segments
 */
export interface CustomerSegments {
  /** Customers with exactly 1 order (all-time) */
  new_customers: RevenueSegment
  /** Customers with 2-5 orders (all-time) */
  repeat_customers: RevenueSegment
  /** Customers with 6-10 orders (all-time) */
  loyal_customers: RevenueSegment
  /** Customers with 11+ orders (all-time) */
  vip_customers: RevenueSegment
  /** Customers who haven't ordered in 90+ days */
  at_risk_customers: RecencySegment
  /** Customers who haven't ordered in 180+ days */
  churned_customers: RecencySegment
}

/**
 * Complete customer segments response from the backend
 * Response from /api/v1/dashboard/statistics/customer_segments/
 *
 * Backend endpoint: GET /dashboard/statistics/customer_segments/
 * Query params: days (default: 365, max: 3650)
 */
export interface CustomerSegmentsResponse {
  /** Number of days included in the analysis */
  period_days: number
  /** Customer segments with their metrics */
  segments: CustomerSegments
}

/**
 * Query parameters for customer segments endpoint
 */
export interface CustomerSegmentsParams {
  /** Number of days to look back for revenue calculations (default: 365, max: 3650) */
  days?: number
}

/**
 * New vs Returning Customers Types
 * These types match the backend API response from /dashboard/statistics/new_vs_returning/
 */

/**
 * Customer segment data (new or returning)
 */
export interface CustomerSegmentData {
  /** Number of customers in this segment */
  count: number
  /** Number of orders from this segment */
  orders: number
  /** Total revenue from this segment */
  revenue: number
  /** Percentage of total revenue */
  percentage_of_revenue: number
  /** Average order value for this segment */
  avg_order_value: number
}

/**
 * Complete new vs returning customers response from the backend
 * Response from /api/v1/dashboard/statistics/new_vs_returning/
 *
 * Backend endpoint: GET /dashboard/statistics/new_vs_returning/
 * Query params: days (default: 30, max: 365)
 */
export interface NewVsReturningResponse {
  /** Number of days included in the analysis */
  period_days: number
  /** New customers data */
  new_customers: CustomerSegmentData
  /** Returning customers data */
  returning_customers: CustomerSegmentData
}

/**
 * Query parameters for new vs returning endpoint
 */
export interface NewVsReturningParams {
  /** Number of days to look back (default: 30, max: 365) */
  days?: number
}

/**
 * Customer Purchase Behavior Types
 * These types match the backend API response from /dashboard/statistics/customer_purchase_behavior/
 */

/**
 * Most active customer data
 */
export interface MostActiveCustomer {
  /** Customer UUID */
  customer_id: string
  /** Customer full name */
  customer_name: string
  /** Customer email address */
  customer_email: string
  /** Number of orders placed in the period */
  order_count: number
  /** Total amount spent in the period */
  total_spent: number
  /** Customer's favorite product category */
  favorite_category: string
  /** Customer's preferred payment method */
  preferred_payment_method: string
}

/**
 * Category preference data
 */
export interface CategoryPreference {
  /** Category name */
  category: string
  /** Number of unique customers who purchased from this category */
  unique_customers: number
  /** Total number of orders in this category */
  total_orders: number
  /** Average order value for this category */
  avg_order_value: number
}

/**
 * Payment method distribution data
 */
export interface PaymentMethodDistribution {
  /** Number of customers using this payment method */
  customers: number
  /** Percentage of customers using this payment method */
  percentage: number
}

/**
 * Complete customer purchase behavior response from the backend
 * Response from /api/v1/dashboard/statistics/customer_purchase_behavior/
 *
 * Backend endpoint: GET /dashboard/statistics/customer_purchase_behavior/
 * Query params: days (default: 90, max: 365), limit (default: 20, max: 100)
 */
export interface CustomerPurchaseBehaviorResponse {
  /** Number of days included in the analysis */
  period_days: number
  /** Top customers by order frequency */
  most_active_customers: MostActiveCustomer[]
  /** Popular categories with customer counts */
  category_preferences: CategoryPreference[]
  /** Payment method usage by customers (keyed by payment method name) */
  payment_method_distribution: Record<string, PaymentMethodDistribution>
}

/**
 * Query parameters for customer purchase behavior endpoint
 */
export interface CustomerPurchaseBehaviorParams {
  /** Number of days to look back (default: 90, max: 365) */
  days?: number
  /** Number of results to return (default: 20, max: 100) */
  limit?: number
}

