import type { Product } from '@features/products/types'

/**
 * Wishlist API Types
 * Backend returns array of products using ProductListSerializer
 */

// GET /wishlist/ response - array of products
export type Wishlist = Product[]

// POST /wishlist/add/ request
export interface AddToWishlistRequest {
  product_ids: string[] // Array of product UUIDs (write-only)
}

// POST /wishlist/add/ response
// Backend uses AddToWishlistSerializer which has:
// - product_ids (write_only=True) - not in response
// - products (read_only=True) - array of product UUIDs in response
// - created_at, updated_at - timestamps
export interface AddToWishlistResponse {
  detail: string
  products: string[] // Array of product UUIDs (read-only)
  created_at: string
  updated_at: string
}

// POST /wishlist/remove/ request
export interface RemoveFromWishlistRequest {
  product_ids: string[] // Array of product UUIDs to remove
}

// POST /wishlist/remove/ response
// Backend manually constructs response (not using serializer.data)
// Returns the product_ids that were removed
export interface RemoveFromWishlistResponse {
  detail: string
  product_ids: string[] // Array of product UUIDs that were removed
}
