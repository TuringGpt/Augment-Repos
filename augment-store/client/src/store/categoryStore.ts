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

export const useCategoryStore = create<CategoryState>((set) => ({
  // Initial state
  categories: [],
  isLoading: false,
  error: null,

  // Actions
  getAllCategories: async (signal?: AbortSignal) => {
    try {
      set({ isLoading: true, error: null })

      const categories = await productService.getCategories(signal)

      set({
        categories,
        isLoading: false,
      })
    } catch (error) {
      // Handle abort errors gracefully
      // apiClient is axios-based, so cancellation throws CanceledError (not AbortError)
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
        console.log('Category fetch was aborted')
        set({ isLoading: false })
        return
      }

      console.error('Failed to fetch categories:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        isLoading: false,
      })
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

