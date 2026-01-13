import { create } from 'zustand'
import { productService } from '@services/api'
import type { Brand } from '@features/products/types'

interface BrandState {
  brands: Brand[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchBrands: (signal?: AbortSignal) => Promise<void>
  setBrands: (brands: Brand[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearBrands: () => void
}

// Request counter to prevent stale updates
let fetchRequestCounter = 0

export const useBrandStore = create<BrandState>((set, get) => ({
  brands: [],
  isLoading: false,
  error: null,

  fetchBrands: async (signal?: AbortSignal) => {
    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    set({ isLoading: true, error: null })

    try {
      const brands = await productService.getBrands(signal)

      // Only update state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({ brands, isLoading: false })
      }
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts or request is cancelled
      const error = err as { name?: string }
      if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
        return
      }

      console.error('Failed to fetch brands:', err)

      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({ error: 'Failed to fetch brands', isLoading: false })
      }
    }
  },

  setBrands: (brands) => set({ brands }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearBrands: () => set({ brands: [], error: null }),
}))

