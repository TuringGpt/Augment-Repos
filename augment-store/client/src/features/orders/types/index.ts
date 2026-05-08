import type { CartItem } from '@features/cart/types'
import type { Product } from '@features/products/types'

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
// cart_item can be null when the original cart item has been deleted (backend uses on_delete=SET_NULL)
export interface OrderItem {
  id: string
  cart_item: CartItem | null
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
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | null
  payment?: Payment
  created_at: string
  updated_at: string
  created_by: string
  is_deleted: boolean
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
  cart_item: string | null // UUID of the cart item (nullable: on_delete=SET_NULL)
  product: Product | null
  quantity: number
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
