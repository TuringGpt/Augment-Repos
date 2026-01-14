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
      // Handle abort errors gracefully
      // apiClient is axios-based, so cancellation throws CanceledError (not AbortError)
      if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
        console.log('Category fetch was aborted')
        // Reset loading state to prevent UI from getting stuck
        set({ isLoading: false })
        return
      }

      console.error('Failed to fetch categories:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories'
      set({ error: errorMessage, isLoading: false })
    }
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest) => {
    try {
      set({ isUpdating: true, updateError: null })
      const updatedCategory = await productService.updateCategory(id, data)

      // Check if the image field was included in the update request
      const imageWasUpdated = 'image' in data

      // If image was updated, we need to refetch categories to get the actual image URL
      // because the backend returns a UUID string instead of a FileAPI object
      if (imageWasUpdated) {
        // Store the pre-update category to detect if refetch actually succeeded
        const preUpdateCategory = get().categories.find((cat) => cat.id === id)

        // Refetch all categories to get the updated image URL
        await get().fetchCategories()

        // Guard against treating an unchanged store snapshot as a successful refetch
        // If fetchCategories() failed, get().error will be set and categories may be stale
        const fetchError = get().error
        const refetchedCategory = get().categories.find((cat) => cat.id === id)

        set({ isUpdating: false })

        // Only use refetched data if:
        // 1. No fetch error occurred, AND
        // 2. The category was found, AND
        // 3. The data actually changed (different from pre-update snapshot)
        if (!fetchError && refetchedCategory && refetchedCategory !== preUpdateCategory) {
          return refetchedCategory
        }

        // If refetch failed or returned stale data, merge with existing category
        // but preserve the existing image URL to avoid showing broken images
        console.warn('Refetch after image update failed or returned stale data, preserving existing image')
        const currentCategories = get().categories
        const existingCategory = currentCategories.find((cat) => cat.id === id)

        const mergedCategory: Category = {
          ...existingCategory,
          ...updatedCategory,
          // Preserve existing image to avoid broken images (UUID can't be used as URL)
          image: data.image === null ? undefined : existingCategory?.image,
        }

        const updatedCategories = currentCategories.map((cat) =>
          cat.id === id ? mergedCategory : cat
        )
        set({ categories: updatedCategories })

        return mergedCategory
      }

      // If image was not updated, merge the response with existing category
      const currentCategories = get().categories
      const existingCategory = currentCategories.find((cat) => cat.id === id)

      const mergedCategory: Category = {
        ...existingCategory,
        ...updatedCategory,
        // Preserve existing image since it wasn't updated
        image: existingCategory?.image,
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

