import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '@features/cart/types'
import { enrichCart } from '@utils/cartUtils'

export const cartService = {
  getCart: async (): Promise<Cart> => {
    // Don't catch errors - let them propagate to the caller
    // This prevents overwriting existing cart on transient failures
    const cart = await apiClient.get<Cart>(API_ENDPOINTS.CART.GET)
    return enrichCart(cart)
  },

  addToCart: async (data: AddToCartRequest): Promise<Cart> => {
    const cart = await apiClient.post<Cart>(API_ENDPOINTS.CART.ADD, data)
    return enrichCart(cart)
  },

  updateCartItem: async (itemId: string, data: UpdateCartItemRequest): Promise<Cart> => {
    const cart = await apiClient.patch<Cart>(API_ENDPOINTS.CART.UPDATE(itemId), data)
    return enrichCart(cart)
  },

  removeFromCart: async (itemId: string): Promise<Cart> => {
    const cart = await apiClient.delete<Cart>(API_ENDPOINTS.CART.REMOVE(itemId))
    return enrichCart(cart)
  },

  clearCart: async (): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.CART.CLEAR)
  },
}
