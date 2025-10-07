import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '@features/cart/types'

export const cartService = {
  getCart: async (): Promise<Cart> => {
    return apiClient.get<Cart>(API_ENDPOINTS.CART.GET)
  },

  addToCart: async (data: AddToCartRequest): Promise<Cart> => {
    return apiClient.post<Cart>(API_ENDPOINTS.CART.ADD, data)
  },

  updateCartItem: async (itemId: string, data: UpdateCartItemRequest): Promise<Cart> => {
    return apiClient.patch<Cart>(API_ENDPOINTS.CART.UPDATE(itemId), data)
  },

  removeFromCart: async (itemId: string): Promise<Cart> => {
    return apiClient.delete<Cart>(API_ENDPOINTS.CART.REMOVE(itemId))
  },

  clearCart: async (): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.CART.CLEAR)
  },
}

