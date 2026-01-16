import { create } from 'zustand'
import type { CreateCategoryRequest, UpdateCategoryRequest } from '@features/products/types/api'
import type { Category } from '@features/products/types'
import { productService } from '@services/api'

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  error: string | null
  isCreating: boolean
  createError: string | null
  isUpdating: boolean
  updateError: string | null

  // Actions
  fetchCategories: (signal?: AbortSignal) => Promise<void>
  createCategory: (data: CreateCategoryRequest) => Promise<Category>
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
  isCreating: false,
  createError: null,
  isUpdating: false,
  updateError: null,

  // ACTIONS
  fetchCategories: async (signal?: AbortSignal) => {
    const requestId = ++requestCounter

    try {
      set({ isLoading: true, error: null })
      const categories = await productService.getCategories(signal)

      // Only update state if this is still the latest request
      if (requestId === requestCounter) {
        set({ categories, isLoading: false })
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
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories'
        set({ error: errorMessage, isLoading: false })
      }
    }
  },

  createCategory: async (data: CreateCategoryRequest) => {
    try {
      set({ isCreating: true, createError: null })
      const newCategory = await productService.createCategory(data)

      // Check if the image field was included in the create request with an intentional value
      // Distinguish between:
      // - Property not present: no image provided
      // - Property present with null/string: intentional image set/clear
      // - Property present but undefined: treat as "no image" to avoid unnecessary refetch
      const imageWasProvided = 'image' in data && data.image !== undefined

      // If image was provided, we need to refetch categories to get the actual image URL
      // because the backend returns a UUID string instead of a FileAPI object
      if (imageWasProvided) {
        // Refetch all categories to get the updated image URL
        await get().fetchCategories()

        // Guard against treating an unchanged store snapshot as a successful refetch
        // If fetchCategories() failed, get().error will be set and categories may be stale
        const fetchError = get().error
        const refetchedCategory = get().categories.find((cat) => cat.id === newCategory.id)

        set({ isCreating: false })

        // Only use refetched data if:
        // 1. No fetch error occurred, AND
        // 2. The category was found, AND
        // 3. The category exists in the refetched list
        if (!fetchError && refetchedCategory) {
          // Merge POST response with refetched data to preserve fields that only exist in POST response
          // (notably `slug`, since fetchCategories() derives slug from name)
          const mergedCategory: Category = {
            ...refetchedCategory,
            ...newCategory,
            // Use refetched image since that's the whole point of refetching
            image: refetchedCategory.image,
          }

          return mergedCategory
        }

        // If refetch failed or returned stale data, just add the new category without image URL
        console.warn('Refetch after image creation failed or returned stale data, adding category without image URL')
        const updatedCategories = [...get().categories, newCategory]
        set({ categories: updatedCategories })

        return newCategory
      }

      // If image was not provided, just add the new category to the store
      const updatedCategories = [...get().categories, newCategory]
      set({ categories: updatedCategories, isCreating: false })

      return newCategory
    } catch (error) {
      console.error('Failed to create category:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category'
      set({ createError: errorMessage, isCreating: false })
      throw error
    }
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest) => {
    try {
      set({ isUpdating: true, updateError: null })
      const updatedCategory = await productService.updateCategory(id, data)

      // Check if the image field was included in the update request with an intentional value
      // Distinguish between:
      // - Property not present: no image update intended
      // - Property present with null/string: intentional update/clear
      // - Property present but undefined: treat as "no change" to avoid unnecessary refetch
      const imageWasUpdated = 'image' in data && data.image !== undefined

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
          // Merge PATCH response with refetched data to preserve fields that only exist in PATCH response
          // (notably `slug`, since fetchCategories() derives slug from name)
          const mergedCategory: Category = {
            ...refetchedCategory,
            ...updatedCategory,
            // Use refetched image since that's the whole point of refetching
            image: refetchedCategory.image,
          }

          // Update the store's categories array with the merged category
          // This ensures consumers reading from the store see the correct slug and other PATCH-only fields
          const updatedCategories = get().categories.map((cat) =>
            cat.id === id ? mergedCategory : cat
          )
          set({ categories: updatedCategories })

          return mergedCategory
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

