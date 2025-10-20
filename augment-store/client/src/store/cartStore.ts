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

// Helper function to calculate cart totals
const calculateCartTotals = (
  items: CartItem[]
): Pick<Cart, 'subtotal' | 'tax' | 'shipping' | 'total' | 'itemCount'> => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const tax = subtotal * 0.1 // 10% tax rate
  const shipping = subtotal > 50 ? 0 : 5.99 // Free shipping over $50
  const total = subtotal + tax + shipping

  return {
    subtotal,
    tax,
    shipping,
    total,
    itemCount,
  }
}

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

          let updatedItems: CartItem[]

          const existingItemIndex = currentCart.items.findIndex(
            (i) => i.product.id === item.product.id
          )

          if (existingItemIndex >= 0) {
            // Update existing item
            updatedItems = [...currentCart.items]
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + item.quantity,
              subtotal:
                (updatedItems[existingItemIndex].quantity + item.quantity) *
                updatedItems[existingItemIndex].price,
            }
          } else {
            // Add new item
            updatedItems = [...currentCart.items, item]
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
        }),

      updateItem: (itemId, quantity) =>
        set((state) => {
          // Initialize cart if it's null
          const currentCart = state.cart || createEmptyCart()

          const updatedItems = currentCart.items.map((item) =>
            item.id === itemId ? { ...item, quantity, subtotal: quantity * item.price } : item
          )

          // Calculate totals
          const totals = calculateCartTotals(updatedItems)

          return {
            cart: {
              ...currentCart,
              items: updatedItems,
              ...totals,
            },
          }
        }),

      removeItem: (itemId) =>
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
