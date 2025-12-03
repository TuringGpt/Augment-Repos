import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'search-history'
const MAX_HISTORY_ITEMS = 10 // Maximum search history items to store

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([])
  const hasLoadedRef = useRef(false)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        setHistory(parsed)
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
      setHistory([])
    } finally {
      hasLoadedRef.current = true
    }
  }, [])

  // Save history to localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (!hasLoadedRef.current) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }, [history])

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as string[]
            setHistory(parsed)
          } catch (error) {
            console.error('Failed to parse storage event:', error)
          }
        } else {
          // Key was removed, clear history
          setHistory([])
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getHistory = useCallback(() => {
    return history
  }, [history])

  const addToHistory = useCallback((searchTerm: string) => {
    const trimmed = searchTerm.trim()
    if (!trimmed) return

    setHistory((prevHistory) => {
      // Remove the search term if it already exists
      const filtered = prevHistory.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())

      // Add the new search term at the beginning
      const updated = [trimmed, ...filtered]

      // Limit to MAX_HISTORY_ITEMS
      if (updated.length > MAX_HISTORY_ITEMS) {
        return updated.slice(0, MAX_HISTORY_ITEMS)
      }

      return updated
    })
  }, [])

  const removeFromHistory = useCallback((searchTerm: string) => {
    setHistory((prevHistory) =>
      prevHistory.filter((item) => item.toLowerCase() !== searchTerm.toLowerCase())
    )
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    history,
    getHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
}
