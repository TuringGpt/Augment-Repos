import { create } from 'zustand'
import { productService } from '@services/api/products/productService'
import type { Category } from '@features/products/types'
import type { UpdateCategoryRequest } from '@features/products/types/api'

interface CategoryState {
  categories: Category[]
  isLoading: boolean
  error: string | null
  isUpdating: boolean
  updateError: string | null

  // Actions
  fetchCategories: (signal?: AbortSignal) => Promise<void>
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<Category>
  setCategories: (categories: Category[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearCategories: () => void
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  isUpdating: false,
  updateError: null,

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
      const currentCategories = get().categories
      const updatedCategories = currentCategories.map((cat) =>
        cat.id === id ? updatedCategory : cat
      )
      set({ categories: updatedCategories, isUpdating: false })

      return updatedCategory
    } catch (error) {
      console.error('Failed to update category:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category'
      set({ updateError: errorMessage, isUpdating: false })
      throw error
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

