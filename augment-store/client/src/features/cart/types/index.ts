import type { Product } from '@features/products/types'

// Single source of truth - API Response Types (snake_case from backend)
export interface CartItem {
  id: string
  product: Product
  created_at: string
  updated_at: string
  is_deleted: boolean
  quantity: number
  created_by: string
}

export interface Cart {
  id: string
  items: CartItem[]
  created_at: string
  updated_at: string
  is_deleted: boolean
  user: string
  // Calculated fields (not from API)
  subtotal?: number
  tax?: number
  shipping?: number
  total?: number
  itemCount?: number
}

export interface AddToCartRequest {
  productId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

// Helper type for cart items with calculated fields
export interface CartItemWithCalculations extends CartItem {
  price: number
  subtotal: number
}
