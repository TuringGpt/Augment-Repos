import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, CartItem } from '@features/cart/types'

interface CartState {
  cart: Cart | null
  isLoading: boolean
  error: string | null

  // Actions
  setCart: (cart: Cart) => void
  addItem: (item: CartItem) => void
  updateItem: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // Computed
  getItemCount: () => number
  getTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,

      setCart: (cart) => set({ cart }),

      addItem: (item) =>
        set((state) => {
          if (!state.cart) return state

          const existingItemIndex = state.cart.items.findIndex(
            (i) => i.product.id === item.product.id
          )

          if (existingItemIndex >= 0) {
            const updatedItems = [...state.cart.items]
            updatedItems[existingItemIndex].quantity += item.quantity
            return {
              cart: {
                ...state.cart,
                items: updatedItems,
              },
            }
          }

          return {
            cart: {
              ...state.cart,
              items: [...state.cart.items, item],
            },
          }
        }),

      updateItem: (itemId, quantity) =>
        set((state) => {
          if (!state.cart) return state

          const updatedItems = state.cart.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          )

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
            },
          }
        }),

      removeItem: (itemId) =>
        set((state) => {
          if (!state.cart) return state

          return {
            cart: {
              ...state.cart,
              items: state.cart.items.filter((item) => item.id !== itemId),
            },
          }
        }),

      clearCart: () => set({ cart: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      getItemCount: () => {
        const { cart } = get()
        return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0
      },

      getTotal: () => {
        const { cart } = get()
        return cart?.total || 0
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
)
