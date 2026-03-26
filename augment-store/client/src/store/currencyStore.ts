import { create } from 'zustand'
import type { Currency } from '@services/api'

interface CurrencyState {
  currencies: Currency[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchCurrencies: (signal?: AbortSignal) => Promise<void>
  setCurrencies: (currencies: Currency[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearCurrencies: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

export const useCurrencyStore = create<CurrencyState>((set) => ({
  // Initial state
  currencies: [],
  isLoading: false,
  error: null,

  // Actions
  fetchCurrencies: async (signal?: AbortSignal) => {
    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    // Set loading state immediately before any async work to prevent race conditions
    set({ isLoading: true, error: null })

    // Import currencyService dynamically to avoid circular dependency
    const { currencyService } = await import('@services/api')

    try {
      const currencies = await currencyService.getCurrencies(signal)

      // Only update state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({ currencies, error: null, isLoading: false })
      }
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts
      const error = err as {
        name?: string
        response?: { status?: number; data?: { message?: string } }
        message?: string
      }

      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('Currency fetch aborted')
        // Reset loading state if this is still the latest request
        if (requestId === fetchRequestCounter) {
          set({ isLoading: false })
        }
        return
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch currencies. Please try again.'

      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({ error: errorMessage, isLoading: false })
      }

      console.error('Error fetching currencies:', {
        error,
        status: error?.response?.status,
        data: error?.response?.data,
        message: errorMessage,
      })

      throw err
    }
  },

  setCurrencies: (currencies) => set({ currencies }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearCurrencies: () => set({ currencies: [], error: null }),
}))

