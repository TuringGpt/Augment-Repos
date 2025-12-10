import { useCallback, useMemo } from 'react'
import { useCartStore } from '@store/cartStore'
import { useAuthStore } from '@store/authStore'

/**
 * Custom hook to manage all cart functionalities
 * Provides a clean interface for components to interact with the cart
 *
 * @returns Cart state and operations
 */
export function useCart() {
  // Get cart state from store
  const {
    cart,
    isLoading,
    error,
    setCart,
    addItem,
    addItemToCart,
    updateItem,
    updateItemInCart,
    removeItem,
    removeItemFromCart,
    removeItems,
    clearCart,
    setLoading,
    setError,
    refetchCart: storeRefetchCart,
    getItemCount,
    getTotal,
    isInCart,
    getCartItem,
    isItemUpdating,
  } = useCartStore()

  const { isAuthenticated } = useAuthStore()

  // Refetch cart with authentication check
  const refetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('⏭️ Skipping cart sync - user not authenticated')
      return
    }

    console.log('🔄 Refetching cart from API...')
    await storeRefetchCart()
  }, [isAuthenticated, storeRefetchCart])

  // Add item to cart with error handling
  const addToCart = useCallback(
    async (productId: string, quantity: number = 1) => {
      try {
        await addItemToCart(productId, quantity)
        return { success: true, error: null }
      } catch (error) {
        console.error('Failed to add item to cart:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to add item to cart',
        }
      }
    },
    [addItemToCart]
  )

  // Update cart item quantity with error handling
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) {
        console.warn('Quantity must be at least 1')
        return { success: false, error: 'Quantity must be at least 1' }
      }

      try {
        await updateItemInCart(itemId, quantity)
        return { success: true, error: null }
      } catch (error) {
        console.error('Failed to update cart item:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update item quantity',
        }
      }
    },
    [updateItemInCart]
  )

  // Remove item from cart with error handling
  const removeFromCart = useCallback(
    async (itemId: string) => {
      try {
        await removeItemFromCart(itemId)
        return { success: true, error: null }
      } catch (error) {
        console.error('Failed to remove item from cart:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to remove item from cart',
        }
      }
    },
    [removeItemFromCart]
  )

  // Remove multiple items from cart
  const removeBulk = useCallback(
    (itemIds: string[]) => {
      removeItems(itemIds)
    },
    [removeItems]
  )

  // Clear entire cart
  const clear = useCallback(() => {
    clearCart()
  }, [clearCart])

  // Computed values
  const itemCount = useMemo(() => getItemCount(), [cart?.items, getItemCount])
  const total = useMemo(() => getTotal(), [cart?.total, getTotal])
  const isEmpty = useMemo(() => !cart || cart.items.length === 0, [cart])
  const hasItems = useMemo(() => cart && cart.items.length > 0, [cart])

  // Check if a product is in the cart
  const checkInCart = useCallback(
    (productId: string) => {
      return isInCart(productId)
    },
    [isInCart]
  )

  // Get cart item by product ID
  const getItem = useCallback(
    (productId: string) => {
      return getCartItem(productId)
    },
    [getCartItem]
  )

  // Check if an item is being updated
  const checkItemUpdating = useCallback(
    (itemId: string) => {
      return isItemUpdating(itemId)
    },
    [isItemUpdating]
  )

  return {
    // State
    cart,
    isLoading,
    error,
    isEmpty,
    hasItems,
    itemCount,
    total,

    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    removeBulk,
    clear,
    refetchCart,
    setError,

    // Utilities
    checkInCart,
    getItem,
    checkItemUpdating,

    // Direct store methods (for advanced use cases)
    addItem,
    updateItem,
    removeItem,
    setCart,
    setLoading,
  }
}

