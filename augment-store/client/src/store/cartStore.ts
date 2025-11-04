import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, CartItem } from '@features/cart/types'
import { createEmptyCart, calculateCartTotals } from '@utils/cartUtils'

interface CartState {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  updatingItemIds: Set<string> // Track which items are being updated

  // Actions
  setCart: (cart: Cart) => void
  addItem: (item: CartItem) => void
  addItemToCart: (productId: string, quantity: number) => Promise<void>
  updateItem: (itemId: string, quantity: number) => void
  updateItemInCart: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => void
  removeItems: (itemIds: string[]) => void
  clearCart: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  refetchCart: () => Promise<void>

  // Computed
  getItemCount: () => number
  getTotal: () => number
  isInCart: (productId: string) => boolean
  getCartItem: (productId: string) => CartItem | undefined
  isItemUpdating: (itemId: string) => boolean
}

const initialCart: Cart = createEmptyCart()

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: initialCart,
      isLoading: false,
      error: null,
      updatingItemIds: new Set<string>(),

      setCart: (cart) => set({ cart }),

      refetchCart: async () => {
        // Import cartService dynamically to avoid circular dependency
        const { cartService } = await import('@services/api/cart/cartService')
        try {
          const cart = await cartService.getCart()
          set({ cart, error: null })
        } catch (error) {
          console.error('Failed to refetch cart:', error)

          // Only create empty cart for 404 (user has no cart yet)
          // For other errors (network, 5xx), preserve existing cart
          const isNotFound = (error as { response?: { status?: number } })?.response?.status === 404

          if (isNotFound) {
            console.log('No cart found for user - creating empty cart')
            set({ cart: createEmptyCart(), error: null })
          } else {
            // Preserve existing cart on transient failures
            console.warn('Preserving existing cart due to transient error')
            set({ error: 'Failed to load cart. Please try again.' })
          }
        }
      },

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
      },

      addItemToCart: async (productId: string, quantity: number) => {
        // Import cartService dynamically to avoid circular dependency
        const { cartService } = await import('@services/api/cart/cartService')
        try {
          set({ isLoading: true, error: null })
          // Call API to add item to cart
          await cartService.addToCart({ product_id: productId, quantity })
          // Refetch cart to get updated data from backend
          await get().refetchCart()
        } catch (error) {
          console.error('Failed to add item to cart:', error)
          set({ error: 'Failed to add item to cart. Please try again.' })
          throw error
        } finally {
          set({ isLoading: false })
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
      },

      updateItemInCart: async (itemId: string, quantity: number) => {
        // Import cartService dynamically to avoid circular dependency
        const { cartService } = await import('@services/api/cart/cartService')
        try {
          // Add item to updating set
          set((state) => ({
            updatingItemIds: new Set(state.updatingItemIds).add(itemId),
            error: null,
          }))

          // Call API to update item quantity
          await cartService.updateCartItem(itemId, { quantity })

          // Refetch cart to get updated data from backend
          await get().refetchCart()
        } catch (error) {
          console.error('Failed to update cart item:', error)
          set({ error: 'Failed to update item quantity. Please try again.' })
          throw error
        } finally {
          // Remove item from updating set
          set((state) => {
            const newSet = new Set(state.updatingItemIds)
            newSet.delete(itemId)
            return { updatingItemIds: newSet }
          })
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
      },

      clearCart: () => {
        set({ cart: createEmptyCart() })
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

      isItemUpdating: (itemId) => {
        const { updatingItemIds } = get()
        return updatingItemIds.has(itemId)
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
