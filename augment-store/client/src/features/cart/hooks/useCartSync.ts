import { useEffect } from 'react'
import { useAuthStore } from '@store/authStore'
import { useCartStore } from '@store/cartStore'
import { cartService } from '@services/api/cart/cartService'

/**
 * Hook to sync cart from API when user is authenticated
 * Fetches cart on mount if user is logged in
 */
export function useCartSync() {
  const { isAuthenticated } = useAuthStore()
  const { setCart, setLoading, setError } = useCartStore()

  useEffect(() => {
    // Only fetch cart if user is authenticated
    if (!isAuthenticated) {
      return
    }

    const fetchCart = async () => {
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
    }

    fetchCart()
  }, [isAuthenticated, setCart, setLoading, setError])
}

