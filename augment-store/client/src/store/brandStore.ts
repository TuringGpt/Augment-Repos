import { create } from 'zustand'
import { productService } from '@services/api'
import type { Brand } from '@features/products/types'
import type { CreateBrandRequest, UpdateBrandRequest } from '@features/products/types/api'

interface BrandState {
  brands: Brand[]
  isLoading: boolean
  error: string | null
  isCreating: boolean
  createError: string | null
  isUpdating: boolean
  updateError: string | null

  // Actions
  fetchBrands: (signal?: AbortSignal) => Promise<void>
  createBrand: (data: CreateBrandRequest) => Promise<Brand>
  updateBrand: (id: string, data: UpdateBrandRequest) => Promise<Brand>
  deleteBrand: (id: string) => Promise<void>
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
  isCreating: false,
  createError: null,
  isUpdating: false,
  updateError: null,

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
        // Reset loading state if this is still the latest request
        if (requestId === fetchRequestCounter) {
          set({ isLoading: false })
        }
        return
      }

      console.error('Failed to fetch brands:', err)

      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({ error: 'Failed to fetch brands', isLoading: false })
      }
    }
  },

  createBrand: async (data: CreateBrandRequest) => {
    try {
      set({ isCreating: true, createError: null })
      const newBrand = await productService.createBrand(data)

      // Check if the image field was included in the create request with an intentional value
      // Distinguish between:
      // - Property not present: no image provided
      // - Property present with null/string: intentional image set/clear
      // - Property present but undefined: treat as "no image" to avoid unnecessary refetch
      const imageWasProvided = 'image' in data && data.image !== undefined

      // If image was provided, we need to refetch brands to get the actual image URL
      // because the backend returns a UUID string instead of a FileAPI object
      if (imageWasProvided) {
        // Refetch all brands to get the updated image URL
        await get().fetchBrands()

        // Guard against treating an unchanged store snapshot as a successful refetch
        const fetchError = get().error
        const refetchedBrand = get().brands.find((brand) => brand.id === newBrand.id)

        set({ isCreating: false })

        // Only use refetched data if:
        // 1. No fetch error occurred, AND
        // 2. The brand was found
        if (!fetchError && refetchedBrand) {
          // Merge POST response with refetched data to preserve fields that only exist in POST response
          const mergedBrand: Brand = {
            ...refetchedBrand,
            ...newBrand,
            // Use refetched image since that's the whole point of refetching
            image: refetchedBrand.image,
          }

          // Update the brand in the store with the merged value
          const updatedBrands = get().brands.map((brand) =>
            brand.id === newBrand.id ? mergedBrand : brand
          )
          set({ brands: updatedBrands })

          return mergedBrand
        }

        // If refetch failed, add the brand with undefined image
        // (UUID can't be used as URL)
        console.warn('Refetch after image create failed, adding brand without image')
        const brandWithoutImage: Brand = {
          ...newBrand,
          image: undefined,
        }

        // Check if brand already exists to avoid duplicates from concurrent fetchBrands()
        const currentBrands = get().brands
        const existingBrandIndex = currentBrands.findIndex((brand) => brand.id === newBrand.id)
        const updatedBrands =
          existingBrandIndex >= 0
            ? currentBrands.map((brand) => (brand.id === newBrand.id ? brandWithoutImage : brand))
            : [...currentBrands, brandWithoutImage]
        set({ brands: updatedBrands })

        return brandWithoutImage
      }

      // If image was not provided, just add the brand to the store
      // Check if brand already exists to avoid duplicates from concurrent fetchBrands()
      const currentBrands = get().brands
      const existingBrandIndex = currentBrands.findIndex((brand) => brand.id === newBrand.id)
      const updatedBrands =
        existingBrandIndex >= 0
          ? currentBrands.map((brand) => (brand.id === newBrand.id ? newBrand : brand))
          : [...currentBrands, newBrand]
      set({ brands: updatedBrands, isCreating: false })

      return newBrand
    } catch (error) {
      console.error('Failed to create brand:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create brand'
      set({ createError: errorMessage, isCreating: false })
      throw error
    }
  },

  updateBrand: async (id: string, data: UpdateBrandRequest) => {
    try {
      set({ isUpdating: true, updateError: null })
      const updatedBrand = await productService.updateBrand(id, data)

      // Check if the image field was included in the update request with an intentional value
      // Distinguish between:
      // - Property not present: no image update intended
      // - Property present with null/string: intentional update/clear
      // - Property present but undefined: treat as "no change" to avoid unnecessary refetch
      const imageWasUpdated = 'image' in data && data.image !== undefined

      // If image was updated, we need to refetch brands to get the actual image URL
      // because the backend returns a UUID string instead of a FileAPI object
      if (imageWasUpdated) {
        // Store the pre-update brand to detect if refetch actually succeeded
        const preUpdateBrand = get().brands.find((brand) => brand.id === id)

        // Refetch all brands to get the updated image URL
        await get().fetchBrands()

        // Guard against treating an unchanged store snapshot as a successful refetch
        // If fetchBrands() failed, get().error will be set and brands may be stale
        const fetchError = get().error
        const refetchedBrand = get().brands.find((brand) => brand.id === id)

        set({ isUpdating: false })

        // Only use refetched data if:
        // 1. No fetch error occurred, AND
        // 2. The brand was found, AND
        // 3. The data actually changed (different from pre-update snapshot)
        if (!fetchError && refetchedBrand && refetchedBrand !== preUpdateBrand) {
          // Merge PATCH response with refetched data to preserve fields that only exist in PATCH response
          const mergedBrand: Brand = {
            ...refetchedBrand,
            ...updatedBrand,
            // Use refetched image since that's the whole point of refetching
            image: refetchedBrand.image,
          }

          // Update the brand in the store
          const updatedBrands = get().brands.map((brand) =>
            brand.id === id ? mergedBrand : brand
          )
          set({ brands: updatedBrands })

          return mergedBrand
        }

        // If refetch failed or returned stale data, merge with existing brand
        // but preserve the existing image URL to avoid showing broken images
        console.warn('Refetch after image update failed or returned stale data, preserving existing image')
        const currentBrands = get().brands
        const existingBrand = currentBrands.find((brand) => brand.id === id)

        const mergedBrand: Brand = {
          ...existingBrand,
          ...updatedBrand,
          // Preserve existing image to avoid broken images (UUID can't be used as URL)
          image: data.image === null ? undefined : existingBrand?.image,
        }

        const updatedBrands = currentBrands.map((brand) =>
          brand.id === id ? mergedBrand : brand
        )
        set({ brands: updatedBrands })

        return mergedBrand
      }

      // If image was not updated, merge the response with existing brand
      const currentBrands = get().brands
      const existingBrand = currentBrands.find((brand) => brand.id === id)

      const mergedBrand: Brand = {
        ...existingBrand,
        ...updatedBrand,
        // Preserve existing image since it wasn't updated
        image: existingBrand?.image,
      }

      const updatedBrands = currentBrands.map((brand) =>
        brand.id === id ? mergedBrand : brand
      )
      set({ brands: updatedBrands, isUpdating: false })

      return mergedBrand
    } catch (error) {
      console.error('Failed to update brand:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update brand'
      set({ updateError: errorMessage, isUpdating: false })
      throw error
    }
  },

  deleteBrand: async (id: string) => {
    // Increment counter to invalidate any in-flight fetchBrands() requests
    // This prevents a late fetch response from overwriting state with a stale list
    // that re-introduces the deleted brand
    fetchRequestCounter += 1

    // Explicitly clear isLoading to prevent UI from getting stuck in loading state
    // if a stale fetch already set isLoading: true before being invalidated
    set({ error: null, isLoading: false })
    try {
      // Call the API to delete the brand
      await productService.deleteBrand(id)

      // Remove the brand from the local state
      set((state) => ({
        brands: state.brands.filter((brand) => brand.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete brand:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete brand'
      set({ error: errorMessage })
      throw error
    }
  },

  setBrands: (brands) => set({ brands }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearBrands: () =>
    set({
      brands: [],
      error: null,
      isLoading: false,
      isCreating: false,
      createError: null,
      isUpdating: false,
      updateError: null,
    }),
}))

