import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { Cart, AddToCartRequest, UpdateCartItemRequest, PaginatedCartsAPI } from '@features/cart/types'
import { enrichCart } from '@utils/cartUtils'

export const cartService = {
  getCart: async (): Promise<Cart> => {
    // Don't catch errors - let them propagate to the caller
    // This prevents overwriting existing cart on transient failures
    const cart = await apiClient.get<Cart>(API_ENDPOINTS.CART.GET)
    return enrichCart(cart)
  },

  getAdminCarts: async (): Promise<Cart[]> => {
    const response = await apiClient.get<PaginatedCartsAPI>(API_ENDPOINTS.CART.ADMIN)
    // Normalize paginated response to array
    const carts = response.results
    return carts.map(enrichCart)
  },

  addToCart: async (data: AddToCartRequest): Promise<void> => {
    // Backend returns 200/201 with no response body
    await apiClient.post(API_ENDPOINTS.CART.ADD, data)
  },

  updateCartItem: async (
    itemId: string,
    data: UpdateCartItemRequest
  ): Promise<{ quantity: number }> => {
    // API returns just { quantity: number }, not the full cart
    const response = await apiClient.patch<{ quantity: number }>(
      API_ENDPOINTS.CART.UPDATE(itemId),
      data
    )
    return response
  },

  removeFromCart: async (itemId: string): Promise<void> => {
    // Backend returns no response body on success
    await apiClient.delete(API_ENDPOINTS.CART.REMOVE(itemId))
  },

  clearCart: async (): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.CART.CLEAR)
  },
}
