import type { CartItem } from '@features/cart/types'
import type { Address } from '@features/user/types'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: string
  orderNumber: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status: OrderStatus
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  cart_items: string[]
  shipping_address: {
    first_name: string
    last_name: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  billing_address: {
    first_name: string
    last_name: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  contact_information: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  shipping_address_id?: string
  billing_address_id?: string
  contact_information_id?: string
}

export interface OrderListResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OrderListAPIResponse {
  count: number
  next: string | null
  previous: string | null
  results: OrderAPI[]
}

export interface OrderAPI {
  id: string
  status: OrderStatus
  items: OrderItemAPI[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  created_at: string
  updated_at: string
}

export interface OrderItemAPI {
  id: string
  cart_item: CartItem
  created_at: string
}

export interface CreateOrderResponse {
  id: string
  status: OrderStatus
  created_at: string
  shipping_address: {
    first_name: string
    last_name: string
    address_line_1: string
    address_line_2: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  billing_address: {
    first_name: string
    last_name: string
    address_line_1: string
    address_line_2: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  contact_information: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
}
