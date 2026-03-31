import { create } from 'zustand'
import type { Currency, CreateCurrencyRequest } from '@services/api'
import { isAbortError, parseApiError, sanitizeErrorForLogging } from '@utils/errorUtils'

interface CurrencyState {
  currencies: Currency[]
  isLoading: boolean
  error: string | null
  isCreating: boolean
  createError: string | null

  // Actions
  fetchCurrencies: (signal?: AbortSignal) => Promise<void>
  createCurrency: (data: CreateCurrencyRequest, signal?: AbortSignal) => Promise<void>
  setCurrencies: (currencies: Currency[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearCurrencies: () => void
}

// Request counters to track the latest requests
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0
let createRequestCounter = 0

export const useCurrencyStore = create<CurrencyState>((set) => ({
  // Initial state
  currencies: [],
  isLoading: false,
  error: null,
  isCreating: false,
  createError: null,

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
      // Don't clear isLoading if this is an old request - a newer request may still be in-flight
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts
      if (isAbortError(err)) {
        console.log('Currency fetch aborted')
        // Only reset loading state if this is still the latest request
        if (requestId === fetchRequestCounter) {
          set({ isLoading: false })
        }
        return
      }

      // Use parseApiError to extract user-friendly error message from API response
      // This properly handles Django/DRF error responses including detail field
      const errorMessage = parseApiError(err, {
        defaultMessage: 'Failed to fetch currencies. Please try again.',
      })

      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({ error: errorMessage, isLoading: false })
      }
      // Don't clear isLoading if this is an old request - a newer request may still be in-flight

      // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
      console.error('Error fetching currencies:', sanitizeErrorForLogging(err, 'Failed to fetch currencies'))
    }
  },

  createCurrency: async (data: CreateCurrencyRequest, signal?: AbortSignal) => {
    // Use separate isCreating/createError state to avoid race conditions with fetchCurrencies
    // This prevents createCurrency from clearing error or setting isLoading to false
    // while a fetchCurrencies request is still in-flight

    createRequestCounter += 1
    const requestId = createRequestCounter

    // Capture the current fetchRequestCounter at the start of this create
    // This allows us to invalidate only fetchCurrencies() calls that started BEFORE this create
    // preventing invalidation of newer fetches that started after this create began
    const fetchCounterAtCreateStart = fetchRequestCounter

    set({ isCreating: true, createError: null })

    try {
      // Import currencyService dynamically to avoid circular dependency
      const { currencyService } = await import('@services/api')

      // Create the currency
      // Pass the AbortSignal to allow cancellation of the create request
      await currencyService.createCurrency(data, signal)

      // Refetch currencies to get the updated list with the newly created currency
      // Note: The create endpoint returns only basic fields (code, name, symbol)
      // without id, created_at, and updated_at, so we need to refetch to get the complete data
      // Pass the AbortSignal to allow cancellation of the refetch request
      const currencies = await currencyService.getCurrencies(signal)

      // Only update state if this is still the latest request
      // This check protects against race conditions where clearCurrencies() or a newer
      // createCurrency() call invalidates this request while in-flight
      if (requestId === createRequestCounter) {
        // Invalidate any in-flight fetchCurrencies() requests that started BEFORE this create
        // to prevent them from overwriting the just-created currency list with stale data
        // Only invalidate if no newer fetch has started (fetchRequestCounter hasn't changed)
        // This prevents invalidating user-triggered refreshes that started after this create
        if (fetchRequestCounter === fetchCounterAtCreateStart) {
          fetchRequestCounter += 1
        }

        set({ currencies, createError: null, isCreating: false })
      }
      // Don't clear isCreating if this is a stale request - a newer createCurrency may still be in-flight
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts or request is cancelled
      if (isAbortError(err)) {
        console.log('Currency create/refetch aborted')
        // Only reset loading state if this is still the latest request
        if (requestId === createRequestCounter) {
          set({ isCreating: false })
        }
        return
      }

      // Use parseApiError to extract user-friendly error message from API response
      // Pass field names to extract field-specific DRF validation errors (e.g., { code: [...], name: [...] })
      // This properly handles Django/DRF error responses including:
      // - detail field (common for validation errors like duplicates)
      // - field-specific errors (code, name, symbol)
      // - non_field_errors
      const errorMessage = parseApiError(err, {
        fieldNames: ['code', 'name', 'symbol'],
        defaultMessage: 'Failed to create currency. Please try again.',
      })

      // Only update error state if this is still the latest request
      if (requestId === createRequestCounter) {
        set({ createError: errorMessage, isCreating: false })

        // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
        console.error('Error creating currency:', sanitizeErrorForLogging(err, 'Failed to create currency'))

        // Re-throw the error so the caller can handle it (e.g., show a notification)
        // Only throw if this is still the latest request to avoid noisy/unhandled promise rejections
        // from stale/invalidated requests
        throw err
      }
      // Don't clear isCreating or throw error if this is a stale request - a newer createCurrency may still be in-flight
    }
  },

  setCurrencies: (currencies) => set({ currencies }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearCurrencies: () => {
    // Increment both counters to invalidate any in-flight fetch or create requests
    // This ensures that in-flight fetchCurrencies() or createCurrency() calls won't repopulate
    // the currencies array after it has been cleared (e.g., during logout/navigation)
    fetchRequestCounter += 1
    createRequestCounter += 1
    // Reset all loading state to prevent being stuck in loading state if called during active requests
    set({ currencies: [], error: null, isLoading: false, createError: null, isCreating: false })
  },
}))

