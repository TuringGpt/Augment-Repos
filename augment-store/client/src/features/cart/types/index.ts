import type { Product } from '@features/products/types'

// Single source of truth - API Response Types (snake_case from backend)
export interface CartItem {
  id: string
  product: Product | null // Can be null if product was deleted
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

// Cart with items that have guaranteed non-null products (after enrichment)
export interface EnrichedCart extends Omit<Cart, 'items'> {
  items: CartItemWithProduct[]
}

export interface AddToCartRequest {
  product_id: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
  operation?: 'add' | 'subtract' | 'set'
}

// Helper type for cart items with calculated fields
export interface CartItemWithCalculations extends CartItem {
  price: number
  subtotal: number
}

// Helper type for cart items with guaranteed non-null product
// Used after filtering in enrichCart
export interface CartItemWithProduct extends Omit<CartItem, 'product'> {
  product: Product
}
