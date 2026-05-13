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
export interface PaymentAPI {
  id: string
  amount: string // Django returns Decimal as string
  payment_method: 'stripe' | 'paypal'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  order: string // UUID string
  created_at: string
  updated_at: string
}

// Frontend payment type (camelCase with number amount)
export interface Payment {
  id: string
  amount: number
  paymentMethod: 'stripe' | 'paypal'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  order: string
  createdAt: string
  updatedAt: string
}

// Paginated admin payments response from backend (DRF ListAPIView)
export interface AdminPaymentsListResponseAPI {
  count: number
  next: string | null
  previous: string | null
  results: PaymentAPI[]
}

// Frontend admin payments list response
export interface AdminPaymentsListResponse {
  payments: Payment[]
  count: number
  next: string | null
  previous: string | null
}
