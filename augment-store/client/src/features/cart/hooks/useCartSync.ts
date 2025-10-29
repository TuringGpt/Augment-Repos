import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@store/authStore'
import { useCartStore } from '@store/cartStore'
import { cartService } from '@services/api/cart/cartService'

/**
 * Hook to sync cart from API when user is authenticated
 * Fetches cart on mount if user is logged in
 * Returns a refetchCart function to manually refetch the cart
 * Registers the refetch callback with the cart store for automatic refetch after mutations
 */
export function useCartSync() {
  const { isAuthenticated } = useAuthStore()
  const { setCart, setLoading, setError, setRefetchCallback } = useCartStore()

  const refetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const cart = await cartService.getCart()
      setCart(cart)
      console.log('✅ Cart synced from API:', cart)
    } catch (error) {
      console.error('❌ Failed to sync cart from API:', error)
      setError(error instanceof Error ? error.message : 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, setCart, setLoading, setError])

  useEffect(() => {
    // Register refetch callback with cart store
    setRefetchCallback(refetchCart)

    // Cleanup: unregister callback on unmount
    return () => {
      setRefetchCallback(null)
    }
  }, [refetchCart, setRefetchCallback])

  useEffect(() => {
    // Fetch cart on mount if user is authenticated
    refetchCart()
  }, [refetchCart])

  return { refetchCart }
}
