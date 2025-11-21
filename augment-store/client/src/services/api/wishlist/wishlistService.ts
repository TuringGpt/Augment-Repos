import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Wishlist,
  AddToWishlistRequest,
  AddToWishlistResponse,
  RemoveFromWishlistRequest,
  RemoveFromWishlistResponse,
} from '@features/user/types'
import type { ProductAPI } from '@features/products/types/api'
import { transformProductFromAPI } from '@features/products/types/api'

export const wishlistService = {
  /**
   * Get user's wishlist
   * Backend returns array of products using ProductListSerializer
   */
  getWishlist: async (): Promise<Wishlist> => {
    const response = await apiClient.get<ProductAPI[]>(API_ENDPOINTS.WISHLIST.GET)
    // Transform API products to frontend Product type
    return response.map(transformProductFromAPI)
  },

  /**
   * Add products to wishlist
   * Backend expects { product_ids: string[] } and returns { detail: string, product_ids: string[] }
   */
  addToWishlist: async (productIds: string[]): Promise<AddToWishlistResponse> => {
    const request: AddToWishlistRequest = { product_ids: productIds }
    return apiClient.post<AddToWishlistResponse>(API_ENDPOINTS.WISHLIST.ADD, request)
  },

  /**
   * Remove products from wishlist
   * Backend expects { product_ids: string[] } and returns { detail: string, product_ids: string[] }
   */
  removeFromWishlist: async (productIds: string[]): Promise<RemoveFromWishlistResponse> => {
    const request: RemoveFromWishlistRequest = { product_ids: productIds }
    return apiClient.post<RemoveFromWishlistResponse>(API_ENDPOINTS.WISHLIST.REMOVE, request)
  },
}
