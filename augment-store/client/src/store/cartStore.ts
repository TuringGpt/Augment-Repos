import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, EnrichedCart, CartItemWithProduct } from '@features/cart/types'
import { createEmptyCart, calculateCartTotals, enrichCart } from '@utils/cartUtils'

interface CartState {
  cart: EnrichedCart | null
  isLoading: boolean
  error: string | null
  updatingItemIds: Set<string> // Track which items are being updated

  // Actions
  setCart: (cart: EnrichedCart) => void
  addItem: (item: CartItem) => void
  addItemToCart: (productId: string, quantity: number) => Promise<void>
  updateItem: (itemId: string, quantity: number) => void
  updateItemInCart: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => void
  removeItemFromCart: (itemId: string) => Promise<void>
  removeItems: (itemIds: string[]) => void
  clearCart: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  refetchCart: () => Promise<void>

  // Computed
  getItemCount: () => number
  getTotal: () => number
  isInCart: (productId: string) => boolean
  getCartItem: (productId: string) => CartItemWithProduct | undefined
  isItemUpdating: (itemId: string) => boolean
}

const initialCart: EnrichedCart = createEmptyCart()

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
          const rawCart = await cartService.getCart()
          const cart = enrichCart(rawCart)
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

          // Skip if product is null
          if (!item.product) {
            return state
          }

          // Type-safe item with non-null product
          const itemWithProduct = item as CartItemWithProduct

          let updatedItems: CartItemWithProduct[]

          const existingItemIndex = currentCart.items.findIndex(
            (i) => i.product.id === itemWithProduct.product.id
          )

          if (existingItemIndex >= 0) {
            // Replace quantity for existing item (don't add to it)
            updatedItems = [...currentCart.items]
            const existingItem = updatedItems[existingItemIndex]

            // Cap quantity at available stock
            const finalQuantity = Math.min(
              itemWithProduct.quantity,
              existingItem.product.stock ?? itemWithProduct.product.stock
            )

            updatedItems[existingItemIndex] = {
              ...existingItem,
              quantity: finalQuantity,
            }
          } else {
            // Add new item with stock validation
            const finalQuantity = Math.min(
              itemWithProduct.quantity,
              itemWithProduct.product.quantity ?? itemWithProduct.product.stock
            )
            updatedItems = [
              ...currentCart.items,
              {
                ...itemWithProduct,
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
            if (item.id === itemId && item.product) {
              // Cap quantity at available stock
              const finalQuantity = Math.min(
                Math.max(1, quantity),
                item.product.quantity ?? item.product.stock
              )
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
        const { calculateCartTotals } = await import('@utils/cartUtils')

        // Add item to updating set
        set((state) => ({
          updatingItemIds: new Set(state.updatingItemIds).add(itemId),
          error: null,
        }))

        try {
          // Call API to update item quantity with 'set' operation
          // API returns just { quantity: number }, not the full cart
          const response = await cartService.updateCartItem(itemId, {
            quantity,
            operation: 'set',
          })

          // Update the specific item's quantity in the cart and recalculate totals
          set((state) => {
            const newSet = new Set(state.updatingItemIds)
            newSet.delete(itemId)

            if (!state.cart) {
              return { updatingItemIds: newSet }
            }

            // Update the quantity of the specific item
            const updatedItems = state.cart.items.map((item) =>
              item.id === itemId ? { ...item, quantity: response.quantity } : item
            )

            // Recalculate totals with the updated items
            const totals = calculateCartTotals(updatedItems)

            return {
              cart: {
                ...state.cart,
                items: updatedItems,
                ...totals,
              },
              error: null,
              updatingItemIds: newSet,
            }
          })
        } catch (error) {
          console.error('Failed to update cart item:', error)

          // Remove from updating set and set error
          set((state) => {
            const newSet = new Set(state.updatingItemIds)
            newSet.delete(itemId)
            return {
              error: 'Failed to update item quantity. Please try again.',
              updatingItemIds: newSet,
            }
          })
          throw error
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

      removeItemFromCart: async (itemId: string) => {
        // Import cartService dynamically to avoid circular dependency
        const { cartService } = await import('@services/api/cart/cartService')
        try {
          set({ isLoading: true, error: null })
          // Call API to remove item from cart
          await cartService.removeFromCart(itemId)
          // Refetch cart to get updated data from backend
          await get().refetchCart()
        } catch (error) {
          console.error('Failed to remove item from cart:', error)
          set({ error: 'Failed to remove item from cart. Please try again.' })
          throw error
        } finally {
          set({ isLoading: false })
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
