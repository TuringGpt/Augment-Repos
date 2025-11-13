import type { CartItem } from '@features/cart/types'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'

// Address types matching backend snake_case format
export interface OrderAddress {
  id: string
  first_name: string
  last_name: string
  address_line_1: string
  address_line_2?: string | null
  city: string
  state: string
  postal_code: string
  country: string
  created_at: string
  updated_at: string
  is_deleted: boolean
  user: string
}

// Order Item type matching backend format
export interface OrderItem {
  id: string
  cart_item: CartItem
  created_at: string
}

// Payment type matching backend format
export interface Payment {
  id: string
  amount: number
  payment_method: 'stripe' | 'paypal'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: OrderStatus
  shipping_address: OrderAddress | null
  billing_address: OrderAddress | null
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment?: Payment
  created_at: string
  updated_at: string
  created_by: string
  is_deleted: boolean
}

export interface CreateOrderRequest {
  shippingAddressId: string
  billingAddressId: string
  paymentMethodId: string
}

export interface OrderListResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}
