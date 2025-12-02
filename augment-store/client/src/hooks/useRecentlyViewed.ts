import { useEffect, useCallback } from 'react'
import type { Product } from '@features/products/types'

const STORAGE_KEY = 'recently-viewed-products'
const MAX_ITEMS = 12 // Maximum number of recently viewed products to store

interface RecentlyViewedProduct {
  id: string
  name: string
  price: number
  discountPrice?: number
  images: string[]
  category: {
    id: string
    name: string
    slug?: string
  }
  stock: number
  rating: number
  viewedAt: string
}

/**
 * Custom hook for managing recently viewed products
 * 
 * Tracks products viewed by the user and stores them in localStorage.
 * Automatically removes duplicates and maintains a maximum of 12 items.
 * 
 * @example
 * ```tsx
 * const { addRecentlyViewed, getRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed()
 * 
 * // Add a product when user views it
 * addRecentlyViewed(product)
 * 
 * // Get all recently viewed products
 * const recentProducts = getRecentlyViewed()
 * 
 * // Clear all recently viewed products
 * clearRecentlyViewed()
 * ```
 */
export const useRecentlyViewed = () => {
  /**
   * Get recently viewed products from localStorage
   */
  const getRecentlyViewed = useCallback((): RecentlyViewedProduct[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      
      const products = JSON.parse(stored) as RecentlyViewedProduct[]
      // Sort by viewedAt descending (most recent first)
      return products.sort((a, b) => 
        new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
      )
    } catch (error) {
      console.error('Failed to get recently viewed products:', error)
      return []
    }
  }, [])

  /**
   * Add a product to recently viewed list
   * Removes duplicates and maintains max items limit
   */
  const addRecentlyViewed = useCallback((product: Product) => {
    try {
      const current = getRecentlyViewed()
      
      // Remove existing entry if product was already viewed
      const filtered = current.filter(p => p.id !== product.id)
      
      // Create new entry with current timestamp
      const newEntry: RecentlyViewedProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        images: product.images,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        },
        stock: product.stock,
        rating: product.rating,
        viewedAt: new Date().toISOString(),
      }
      
      // Add to beginning of array (most recent first)
      const updated = [newEntry, ...filtered].slice(0, MAX_ITEMS)
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to add recently viewed product:', error)
    }
  }, [getRecentlyViewed])

  /**
   * Clear all recently viewed products
   */
  const clearRecentlyViewed = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear recently viewed products:', error)
    }
  }, [])

  /**
   * Remove a specific product from recently viewed
   */
  const removeRecentlyViewed = useCallback((productId: string) => {
    try {
      const current = getRecentlyViewed()
      const filtered = current.filter(p => p.id !== productId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Failed to remove recently viewed product:', error)
    }
  }, [getRecentlyViewed])

  return {
    getRecentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
    removeRecentlyViewed,
  }
}

