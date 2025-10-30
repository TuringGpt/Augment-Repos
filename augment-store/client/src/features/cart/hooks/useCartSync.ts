import { useCartStore } from '@store/cartStore'
import { useAuthStore } from '@store/authStore'

/**
 * Hook to sync cart from API when user is authenticated
 * Provides a wrapper around the cart store's refetchCart method
 * that checks authentication before syncing
 */
export function useCartSync() {
  const { refetchCart: storeRefetchCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const refetchCart = async () => {
    if (!isAuthenticated) {
      console.log('⏭️ Skipping cart sync - user not authenticated')
      return
    }

    console.log('🔄 Refetching cart from API...')
    await storeRefetchCart()
  }

  return { refetchCart }
}
