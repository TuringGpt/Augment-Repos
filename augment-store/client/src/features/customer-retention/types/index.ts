/**
 * Customer Retention Types
 * These types match the backend API response from /dashboard/statistics/customer_retention/
 */

/**
 * Customer retention metrics for a specific period
 */
export interface CustomerRetentionMetrics {
  period: string
  total_customers: number
  retained_customers: number
  retention_rate: number
  new_customers: number
  churned_customers: number
  churn_rate: number
}

/**
 * Customer cohort analysis
 */
export interface CustomerCohort {
  cohort_period: string
  initial_customers: number
  retained_customers: number
  retention_rate: number
}

/**
 * Customer lifetime value metrics
 */
export interface CustomerLifetimeValue {
  average_lifetime_value: number
  average_order_frequency: number
  average_order_value: number
  customer_lifespan_days: number
}

/**
 * Customer segmentation by activity
 */
export interface CustomerSegmentation {
  active_customers: number
  at_risk_customers: number
  inactive_customers: number
  loyal_customers: number
}

/**
 * Complete customer retention response from the backend
 * Response from /api/v1/dashboard/statistics/customer_retention/
 */
export interface CustomerRetentionResponse {
  period_days: number
  retention_metrics: CustomerRetentionMetrics
  cohort_analysis: CustomerCohort[]
  lifetime_value: CustomerLifetimeValue
  segmentation: CustomerSegmentation
}

/**
 * Query parameters for customer retention endpoint
 */
export interface CustomerRetentionParams {
  days?: number
}

