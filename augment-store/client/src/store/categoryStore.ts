import { create } from 'zustand'
import type { UpdateCategoryRequest } from '@features/products/types/api'
import type { Category } from '@features/products/types'
import { productService } from '@services/api'

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  error: string | null
  isUpdating: boolean
  updateError: string | null

  // Actions
  fetchCategories: (signal?: AbortSignal) => Promise<void>
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<Category>
  getAllCategories: (signal?: AbortSignal) => Promise<void>
  setCategories: (categories: Category[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearCategories: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let requestCounter = 0

export const useCategoryStore = create<CategoryState>((set, get) => ({
  // Initial state
  categories: [],
  isLoading: false,
  error: null,
  isUpdating: false,
  updateError: null,

  // ACTIONS
  fetchCategories: async (signal?: AbortSignal) => {
    try {
      set({ isLoading: true, error: null })
      const categories = await productService.getCategories(signal)
      set({ categories, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories'
      set({ error: errorMessage, isLoading: false })
    }
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest) => {
    try {
      set({ isUpdating: true, updateError: null })
      const updatedCategory = await productService.updateCategory(id, data)

      // Update the category in the local state
      // Merge with existing category to preserve fields like image that may not be
      // properly returned by the backend's ProductCategoryDetailSerializer
      const currentCategories = get().categories
      const existingCategory = currentCategories.find((cat) => cat.id === id)

      const mergedCategory: Category = {
        ...existingCategory,
        ...updatedCategory,
        // Preserve existing image if the update response doesn't have one
        // This prevents clearing the image when the backend returns a UUID instead of FileAPI
        image: updatedCategory.image || existingCategory?.image,
      }

      const updatedCategories = currentCategories.map((cat) =>
        cat.id === id ? mergedCategory : cat
      )
      set({ categories: updatedCategories, isUpdating: false })

      return mergedCategory
    } catch (error) {
      console.error('Failed to update category:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category'
      set({ updateError: errorMessage, isUpdating: false })
      throw error
    }
  },

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

