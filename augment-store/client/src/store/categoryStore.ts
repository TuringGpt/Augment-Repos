import { create } from 'zustand'
import type { Category } from '@features/products/types'
import { productService } from '@services/api'

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  error: string | null

  // Actions
  getAllCategories: (signal?: AbortSignal) => Promise<void>
  setCategories: (categories: Category[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearCategories: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let requestCounter = 0

export const useCategoryStore = create<CategoryState>((set) => ({
  // Initial state
  categories: [],
  isLoading: false,
  error: null,

  // Actions
  getAllCategories: async (signal?: AbortSignal) => {
    const requestId = ++requestCounter

    try {
      set({ isLoading: true, error: null })

      const categories = await productService.getCategories(signal)

      // Only update state if this is still the latest request
      if (requestId === requestCounter) {
        set({
          categories,
          isLoading: false,
        })
      }
    } catch (error) {
      // Handle abort errors gracefully
      // apiClient is axios-based, so cancellation throws CanceledError (not AbortError)
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
        console.log('Category fetch was aborted')
        // Reset loading state if this was the latest request to prevent UI from getting stuck
        if (requestId === requestCounter) {
          set({ isLoading: false })
        }
        return
      }

      console.error('Failed to fetch categories:', error)
      // Only update error state if this is still the latest request
      if (requestId === requestCounter) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch categories',
          isLoading: false,
        })
      }
    }
  },

  setCategories: (categories) => set({ categories }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearCategories: () =>
    set({
      categories: [],
      error: null,
    }),
}))

