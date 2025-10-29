import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, CartItem } from '@features/cart/types'
import { createEmptyCart, calculateCartTotals } from '@utils/cartUtils'

interface CartState {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  refetchCallback: (() => Promise<void>) | null

  // Actions
  setCart: (cart: Cart) => void
  addItem: (item: CartItem) => void
  updateItem: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  removeItems: (itemIds: string[]) => void
  clearCart: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setRefetchCallback: (callback: (() => Promise<void>) | null) => void

  // Computed
  getItemCount: () => number
  getTotal: () => number
  isInCart: (productId: string) => boolean
  getCartItem: (productId: string) => CartItem | undefined
}

const initialCart: Cart = createEmptyCart()

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: initialCart,
      isLoading: false,
      error: null,
      refetchCallback: null,

      setCart: (cart) => set({ cart }),

      setRefetchCallback: (callback) => set({ refetchCallback: callback }),

      addItem: (item) => {
        set((state) => {
          // Initialize cart if it's null
          const currentCart = state.cart || createEmptyCart()

          let updatedItems: CartItem[]

          const existingItemIndex = currentCart.items.findIndex(
            (i) => i.product.id === item.product.id
          )

          if (existingItemIndex >= 0) {
            // Replace quantity for existing item (don't add to it)
            updatedItems = [...currentCart.items]
            const existingItem = updatedItems[existingItemIndex]

            // Cap quantity at available stock
            const finalQuantity = Math.min(item.quantity, existingItem.product.stock)

            updatedItems[existingItemIndex] = {
              ...existingItem,
              quantity: finalQuantity,
            }
          } else {
            // Add new item with stock validation
            const finalQuantity = Math.min(item.quantity, item.product.stock)
            updatedItems = [
              ...currentCart.items,
              {
                ...item,
                quantity: finalQuantity,
              },
            ]
          }

          // Calculate totals
          const totals = calculateCartTotals(updatedItems)

          return {
            cart: {
              ...currentCart,
              items: updatedItems,
              ...totals,
            },
          }
        })

        // Refetch cart from API after mutation
        const { refetchCallback } = get()
        if (refetchCallback) {
          refetchCallback()
        }
      },

      updateItem: (itemId, quantity) => {
        set((state) => {
          // Initialize cart if it's null
          const currentCart = state.cart || createEmptyCart()

          const updatedItems = currentCart.items.map((item) => {
            if (item.id === itemId) {
              // Cap quantity at available stock
              const finalQuantity = Math.min(Math.max(1, quantity), item.product.stock)
              return { ...item, quantity: finalQuantity }
            }
            return item
          })

          // Calculate totals
          const totals = calculateCartTotals(updatedItems)

          return {
            cart: {
              ...currentCart,
              items: updatedItems,
              ...totals,
            },
          }
        })

        // Refetch cart from API after mutation
        const { refetchCallback } = get()
        if (refetchCallback) {
          refetchCallback()
        }
      },

      removeItem: (itemId) => {
        set((state) => {
          // Initialize cart if it's null
          const currentCart = state.cart || createEmptyCart()

          const updatedItems = currentCart.items.filter((item) => item.id !== itemId)

          // Calculate totals
          const totals = calculateCartTotals(updatedItems)

          return {
            cart: {
              ...currentCart,
              items: updatedItems,
              ...totals,
            },
          }
        })

        // Refetch cart from API after mutation
        const { refetchCallback } = get()
        if (refetchCallback) {
          refetchCallback()
        }
      },

      removeItems: (itemIds) => {
        set((state) => {
          // Initialize cart if it's null
          const currentCart = state.cart || createEmptyCart()

          const updatedItems = currentCart.items.filter((item) => !itemIds.includes(item.id))

          // Calculate totals
          const totals = calculateCartTotals(updatedItems)

          return {
            cart: {
              ...currentCart,
              items: updatedItems,
              ...totals,
            },
          }
        })

        // Refetch cart from API after mutation
        const { refetchCallback } = get()
        if (refetchCallback) {
          refetchCallback()
        }
      },

      clearCart: () => {
        set({ cart: createEmptyCart() })

        // Refetch cart from API after mutation
        const { refetchCallback } = get()
        if (refetchCallback) {
          refetchCallback()
        }
      },

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
