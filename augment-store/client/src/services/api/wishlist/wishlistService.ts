import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { Wishlist } from '@features/user/types'
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
}

