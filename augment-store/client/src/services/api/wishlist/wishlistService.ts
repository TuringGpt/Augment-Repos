import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Wishlist,
  AddToWishlistRequest,
  AddToWishlistResponse,
  RemoveFromWishlistRequest,
  RemoveFromWishlistResponse,
} from '@features/user/types'
import type { PaginatedProductsAPI } from '@features/products/types/api'
import { transformProductFromAPI } from '@features/products/types/api'

export const wishlistService = {
  /**
   * Get user's wishlist
   * Backend uses ListAPIView with PageNumberPagination, so returns paginated response:
   * { count, next, previous, results: ProductAPI[] }
   */
  getWishlist: async (): Promise<Wishlist> => {
    const response = await apiClient.get<PaginatedProductsAPI>(API_ENDPOINTS.WISHLIST.GET)
    // Transform API products to frontend Product type
    return response.results.map(transformProductFromAPI)
  },

  /**
   * Add products to wishlist
   * Backend expects { product_ids: string[] } (write-only)
   * Backend returns { detail: string, products: string[], created_at: string, updated_at: string }
   * Note: product_ids is write-only in the serializer, response contains products (read-only)
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
