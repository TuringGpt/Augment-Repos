import { useWishlistStore } from '@store/wishlistStore'
import { useAuthStore } from '@store/authStore'

/**
 * Hook to sync wishlist from API when user is authenticated
 * Provides a wrapper around the wishlist store's fetchWishlist method
 * that checks authentication before syncing
 */
export function useWishlistSync() {
  const { fetchWishlist: storeFetchWishlist } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      console.log('⏭️ Skipping wishlist sync - user not authenticated')
      return
    }

    console.log('🔄 Fetching wishlist from API...')
    await storeFetchWishlist()
  }

  return { fetchWishlist }
}

