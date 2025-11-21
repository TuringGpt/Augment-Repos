// Payment Session Types for Stripe Embedded Checkout
export interface CreatePaymentSessionRequest {
  order: number | string
  payment_method: 'stripe'
}

export interface CreatePaymentSessionResponse {
  client_secret: string
  session_id?: string
}
