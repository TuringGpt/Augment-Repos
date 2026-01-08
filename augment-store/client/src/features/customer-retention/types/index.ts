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
 * Customer data for a specific time period
 */
export interface CustomerPeriodData {
  /** Period identifier (e.g., "2024-01" for monthly, "2024-W01" for weekly) */
  period: string
  /** Number of new customers in this period */
  new_customers: number
  /** Number of returning customers in this period */
  returning_customers: number
  /** Total customers in this period */
  total_customers: number
  /** Percentage of new customers */
  new_customers_percentage: number
  /** Percentage of returning customers */
  returning_customers_percentage: number
}

/**
 * Complete new vs returning customers response from the backend
 * Response from /api/v1/dashboard/statistics/new_vs_returning/
 *
 * Backend endpoint: GET /dashboard/statistics/new_vs_returning/
 * Query params: days (default: 365, max: 3650)
 */
export interface NewVsReturningResponse {
  /** Number of days included in the analysis */
  period_days: number
  /** Total new customers in the entire period */
  total_new_customers: number
  /** Total returning customers in the entire period */
  total_returning_customers: number
  /** Overall percentage of new customers */
  new_customers_percentage: number
  /** Overall percentage of returning customers */
  returning_customers_percentage: number
  /** Time series data broken down by period */
  time_series: CustomerPeriodData[]
}

/**
 * Query parameters for new vs returning endpoint
 */
export interface NewVsReturningParams {
  /** Number of days to look back (default: 365, max: 3650) */
  days?: number
}

