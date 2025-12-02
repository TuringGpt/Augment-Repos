import { useState, useEffect, useCallback } from 'react'
import type { Product } from '@features/products/types'

const STORAGE_KEY = 'save-for-later-items'
const MAX_ITEMS = 50 // Maximum items to store

export interface SaveForLaterItem {
  product: Product
  quantity: number
  savedAt: string
}

export const useSaveForLater = () => {
  const [items, setItems] = useState<SaveForLaterItem[]>([])

  // Load items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as SaveForLaterItem[]
        setItems(parsed)
      }
    } catch (error) {
      console.error('Failed to load save for later items:', error)
      setItems([])
    }
  }, [])

  // Save items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save items to localStorage:', error)
    }
  }, [items])

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as SaveForLaterItem[]
          setItems(parsed)
        } catch (error) {
          console.error('Failed to parse storage event:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getSavedItems = useCallback(() => {
    return items
  }, [items])

  const addItem = useCallback(
    (product: Product, quantity: number = 1) => {
      setItems((prevItems) => {
        // Check if item already exists
        const existingIndex = prevItems.findIndex((item) => item.product.id === product.id)

        if (existingIndex !== -1) {
          // Update existing item
          const updated = [...prevItems]
          updated[existingIndex] = {
            product,
            quantity,
            savedAt: new Date().toISOString(),
          }
          return updated
        }

        // Add new item at the beginning
        const newItem: SaveForLaterItem = {
          product,
          quantity,
          savedAt: new Date().toISOString(),
        }

        const updated = [newItem, ...prevItems]

        // Limit to MAX_ITEMS
        if (updated.length > MAX_ITEMS) {
          return updated.slice(0, MAX_ITEMS)
        }

        return updated
      })
    },
    []
  )

  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return

    setItems((prevItems) => {
      const index = prevItems.findIndex((item) => item.product.id === productId)
      if (index === -1) return prevItems

      const updated = [...prevItems]
      updated[index] = {
        ...updated[index],
        quantity,
      }
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setItems([])
  }, [])

  const isItemSaved = useCallback(
    (productId: string) => {
      return items.some((item) => item.product.id === productId)
    },
    [items]
  )

  const getItem = useCallback(
    (productId: string) => {
      return items.find((item) => item.product.id === productId)
    },
    [items]
  )

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }, [items])

  return {
    items,
    getSavedItems,
    addItem,
    removeItem,
    updateQuantity,
    clearAll,
    isItemSaved,
    getItem,
    getTotalItems,
  }
}

