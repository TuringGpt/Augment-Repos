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

