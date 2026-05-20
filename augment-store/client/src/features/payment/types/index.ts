// Payment Session Types for Stripe Embedded Checkout
export interface CreatePaymentSessionRequest {
  order: string // UUID string from order creation
  payment_method: 'stripe'
}

export interface CreatePaymentSessionResponse {
  id: string // Payment ID from backend
  client_secret: string
  order: string
  payment_method: 'stripe' | 'paypal'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  created_at: string
  updated_at: string
}

// Payment type for admin list (matches backend format)
export interface AdminPaymentAPI {
  id: string
  order_id: string // UUID string - Backend returns order_id from AdminPaymentListSerializer
  customer_email: string // Customer email from created_by.email
  amount: string // Django returns Decimal as string
  payment_method: 'stripe' | 'paypal'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  stripe_session_id: string | null // Stripe session ID
  created_at: string
  updated_at: string
}

// Frontend admin payment type (camelCase with string amount for exact currency representation)
export interface AdminPayment {
  id: string
  orderId: string
  customerEmail: string
  amount: string // Keep as string to avoid floating-point precision issues with currency
  paymentMethod: 'stripe' | 'paypal'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  stripeSessionId: string | null
  createdAt: string
  updatedAt: string
}

// Paginated admin payments response from backend (DRF ListAPIView)
export interface AdminPaymentsListResponseAPI {
  count: number
  next: string | null
  previous: string | null
  results: AdminPaymentAPI[]
}

// Frontend admin payments list response
export interface AdminPaymentsListResponse {
  payments: AdminPayment[]
  count: number
  next: string | null
  previous: string | null
}
