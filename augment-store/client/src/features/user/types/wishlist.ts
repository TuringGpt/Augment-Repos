import type { Product } from '@features/products/types'

/**
 * Wishlist API Types
 * Backend returns array of products using ProductListSerializer
 */

// GET /wishlist/ response - array of products
export type Wishlist = Product[]

// POST /wishlist/add/ request
export interface AddToWishlistRequest {
  product_ids: string[] // Array of product UUIDs
}

// POST /wishlist/add/ response
export interface AddToWishlistResponse {
  detail: string
  product_ids: string[]
}

// POST /wishlist/remove/ request
export interface RemoveFromWishlistRequest {
  product_ids: string[] // Array of product UUIDs
}

// POST /wishlist/remove/ response
export interface RemoveFromWishlistResponse {
  detail: string
  product_ids: string[]
}

