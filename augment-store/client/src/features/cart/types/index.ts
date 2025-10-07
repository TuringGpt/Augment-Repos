import type { Product } from '@features/products/types'

export interface CartItem {
  id: string
  product: Product
  quantity: number
  price: number
  subtotal: number
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  itemCount: number
}

export interface AddToCartRequest {
  productId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

