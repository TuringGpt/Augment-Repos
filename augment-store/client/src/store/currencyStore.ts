import { create } from 'zustand'
import type { Currency, CreateCurrencyRequest } from '@services/api'
import { isAbortError, sanitizeErrorForLogging } from '@utils/errorUtils'

interface CurrencyState {
  currencies: Currency[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchCurrencies: (signal?: AbortSignal) => Promise<void>
  createCurrency: (data: CreateCurrencyRequest) => Promise<void>
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

    try {
      // Import currencyService dynamically to avoid circular dependency
      const { currencyService } = await import('@services/api')

      const currencies = await currencyService.getCurrencies(signal)

      // Only update state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({ currencies, error: null, isLoading: false })
      }
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts
      if (isAbortError(err)) {
        console.log('Currency fetch aborted')
        // Reset loading state if this is still the latest request
        if (requestId === fetchRequestCounter) {
          set({ isLoading: false })
        }
        return
      }

      const error = err as {
        response?: { status?: number; data?: { message?: string } }
        message?: string
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch currencies. Please try again.'

      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({ error: errorMessage, isLoading: false })
      }

      // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
      console.error('Error fetching currencies:', sanitizeErrorForLogging(err, 'Failed to fetch currencies'))
    }
  },

  createCurrency: async (data: CreateCurrencyRequest) => {
    set({ isLoading: true, error: null })

    try {
      // Import currencyService dynamically to avoid circular dependency
      const { currencyService } = await import('@services/api')

      // Create the currency
      await currencyService.createCurrency(data)

      // Refetch currencies to get the updated list with the newly created currency
      // Note: The create endpoint returns only basic fields (code, name, symbol)
      // without id, created_at, and updated_at, so we need to refetch to get the complete data
      const currencies = await currencyService.getCurrencies()

      set({ currencies, error: null, isLoading: false })
    } catch (err) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } }
        message?: string
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create currency. Please try again.'

      set({ error: errorMessage, isLoading: false })

      // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
      console.error('Error creating currency:', sanitizeErrorForLogging(err, 'Failed to create currency'))

      // Re-throw the error so the caller can handle it (e.g., show a notification)
      throw err
    }
  },

  setCurrencies: (currencies) => set({ currencies }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearCurrencies: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This ensures that in-flight fetchCurrencies() calls won't repopulate
    // the currencies array after it has been cleared (e.g., during logout/navigation)
    fetchRequestCounter += 1
    // Reset loading state to prevent being stuck in loading state if called during an active fetch
    set({ currencies: [], error: null, isLoading: false })
  },
}))

