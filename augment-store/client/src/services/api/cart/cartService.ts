import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { Cart, CartAPI, AddToCartRequest, UpdateCartItemRequest } from '@features/cart/types'
import { transformCart, createEmptyCart } from '@utils/cartUtils'

export const cartService = {
  getCart: async (): Promise<Cart> => {
    try {
      const apiCart = await apiClient.get<CartAPI>(API_ENDPOINTS.CART.GET)
      return transformCart(apiCart)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      // Return empty cart on error
      return createEmptyCart()
    }
  },

  addToCart: async (data: AddToCartRequest): Promise<Cart> => {
    const apiCart = await apiClient.post<CartAPI>(API_ENDPOINTS.CART.ADD, data)
    return transformCart(apiCart)
  },

  updateCartItem: async (itemId: string, data: UpdateCartItemRequest): Promise<Cart> => {
    const apiCart = await apiClient.patch<CartAPI>(API_ENDPOINTS.CART.UPDATE(itemId), data)
    return transformCart(apiCart)
  },

  removeFromCart: async (itemId: string): Promise<Cart> => {
    const apiCart = await apiClient.delete<CartAPI>(API_ENDPOINTS.CART.REMOVE(itemId))
    return transformCart(apiCart)
  },

  clearCart: async (): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.CART.CLEAR)
  },
}
