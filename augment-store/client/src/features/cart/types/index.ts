import type { Product } from '@features/products/types'

// API Response Types (snake_case from backend)
export interface CartItemAPI {
  id: string
  product: Product
  created_at: string
  updated_at: string
  is_deleted: boolean
  quantity: number
  created_by: string
}

export interface CartAPI {
  id: string
  items: CartItemAPI[]
  created_at: string
  updated_at: string
  is_deleted: boolean
  user: string
}

// Frontend Types (camelCase for UI)
export interface CartItem {
  id: string
  product: Product
  quantity: number
  price: number
  subtotal: number
  createdAt?: string
  updatedAt?: string
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  itemCount: number
  createdAt?: string
  updatedAt?: string
  user?: string
}

export interface AddToCartRequest {
  productId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}
