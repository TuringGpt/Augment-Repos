import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Wishlist } from '@features/user/types'

interface WishlistState {
  wishlist: Wishlist
  isLoading: boolean
  error: string | null

  // Actions
  setWishlist: (wishlist: Wishlist) => void
  fetchWishlist: () => Promise<void>
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearWishlist: () => void

  // Computed
  getItemCount: () => number
  isInWishlist: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      isLoading: false,
      error: null,

      setWishlist: (wishlist) => set({ wishlist }),

      fetchWishlist: async () => {
        // Import wishlistService dynamically to avoid circular dependency
        const { wishlistService } = await import('@services/api/wishlist/wishlistService')
        try {
          set({ isLoading: true, error: null })
          const wishlist = await wishlistService.getWishlist()
          set({ wishlist, error: null })
        } catch (error) {
          console.error('Failed to fetch wishlist:', error)

          // Only clear wishlist for 404 (user has no wishlist yet)
          // For other errors (network, 5xx), preserve existing wishlist
          const isNotFound = (error as { response?: { status?: number } })?.response?.status === 404

          if (isNotFound) {
            console.log('No wishlist found for user - creating empty wishlist')
            set({ wishlist: [], error: null })
          } else {
            // Preserve existing wishlist on transient failures
            console.warn('Preserving existing wishlist due to transient error')
            set({ error: 'Failed to load wishlist. Please try again.' })
          }
        } finally {
          set({ isLoading: false })
        }
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearWishlist: () => set({ wishlist: [] }),

      getItemCount: () => {
        const { wishlist } = get()
        return wishlist.length
      },

      isInWishlist: (productId) => {
        const { wishlist } = get()
        return wishlist.some((product) => product.id === productId)
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        wishlist: state.wishlist,
      }),
    }
  )
)

