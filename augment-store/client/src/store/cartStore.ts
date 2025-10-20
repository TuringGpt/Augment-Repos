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
  isInCart: (productId: string) => boolean
  getCartItem: (productId: string) => CartItem | undefined
}

const createEmptyCart = (): Cart => ({
  id: 'cart-' + Date.now(),
  items: [],
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  itemCount: 0,
})

const initialCart: Cart = createEmptyCart()

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: initialCart,
      isLoading: false,
      error: null,

      setCart: (cart) => set({ cart }),

      addItem: (item) =>
        set((state) => {
          // Initialize cart if it's null
          const currentCart = state.cart || createEmptyCart()

          const existingItemIndex = currentCart.items.findIndex(
            (i) => i.product.id === item.product.id
          )

          if (existingItemIndex >= 0) {
            const updatedItems = [...currentCart.items]
            updatedItems[existingItemIndex].quantity += item.quantity
            return {
              cart: {
                ...currentCart,
                items: updatedItems,
              },
            }
          }

          return {
            cart: {
              ...currentCart,
              items: [...currentCart.items, item],
            },
          }
        }),

      updateItem: (itemId, quantity) =>
        set((state) => {
          // Initialize cart if it's null
          const currentCart = state.cart || createEmptyCart()

          const updatedItems = currentCart.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          )

          return {
            cart: {
              ...currentCart,
              items: updatedItems,
            },
          }
        }),

      removeItem: (itemId) =>
        set((state) => {
          // Initialize cart if it's null
          const currentCart = state.cart || createEmptyCart()

          return {
            cart: {
              ...currentCart,
              items: currentCart.items.filter((item) => item.id !== itemId),
            },
          }
        }),

      clearCart: () => set({ cart: createEmptyCart() }),

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

      isInCart: (productId) => {
        const { cart } = get()
        return cart?.items.some((item) => item.product.id === productId) || false
      },

      getCartItem: (productId) => {
        const { cart } = get()
        return cart?.items.find((item) => item.product.id === productId)
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
