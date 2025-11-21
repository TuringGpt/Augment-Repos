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
  addToWishlist: (productIds: string[]) => Promise<void>
  removeFromWishlist: (productIds: string[]) => Promise<void>
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

      addToWishlist: async (productIds: string[]) => {
        // Short-circuit if productIds is empty to avoid unnecessary API call
        if (productIds.length === 0) {
          console.warn('⚠️ addToWishlist called with empty array - skipping API call')
          return
        }

        // Import wishlistService dynamically to avoid circular dependency
        const { wishlistService } = await import('@services/api/wishlist/wishlistService')
        try {
          set({ isLoading: true, error: null })

          // Call API to add products to wishlist
          await wishlistService.addToWishlist(productIds)

          // Refetch wishlist to get updated data
          const wishlist = await wishlistService.getWishlist()
          set({ wishlist, error: null })

          console.log(`✅ Added ${productIds.length} product(s) to wishlist`)
        } catch (error) {
          console.error('Failed to add to wishlist:', error)
          set({ error: 'Failed to add to wishlist. Please try again.' })
          throw error // Re-throw so UI can handle it
        } finally {
          set({ isLoading: false })
        }
      },

      removeFromWishlist: async (productIds: string[]) => {
        // Import wishlistService dynamically to avoid circular dependency
        const { wishlistService } = await import('@services/api/wishlist/wishlistService')
        try {
          set({ isLoading: true, error: null })

          // Call API to remove products from wishlist
          await wishlistService.removeFromWishlist(productIds)

          // Refetch wishlist to get updated data
          const wishlist = await wishlistService.getWishlist()
          set({ wishlist, error: null })

          console.log(`✅ Removed ${productIds.length} product(s) from wishlist`)
        } catch (error) {
          console.error('Failed to remove from wishlist:', error)
          set({ error: 'Failed to remove from wishlist. Please try again.' })
          throw error // Re-throw so UI can handle it
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
