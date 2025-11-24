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
