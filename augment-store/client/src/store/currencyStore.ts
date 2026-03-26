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

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  // Initial state
  currencies: [],
  isLoading: false,
  error: null,

  // Actions
  fetchCurrencies: async (signal?: AbortSignal) => {
    // Import currencyService dynamically to avoid circular dependency
    const { currencyService } = await import('@services/api')

    try {
      set({ isLoading: true, error: null })

      const currencies = await currencyService.getCurrencies(signal)

      // Only update state if not aborted
      if (!signal?.aborted) {
        set({ currencies, error: null })
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
        return
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch currencies. Please try again.'

      set({ error: errorMessage })
      console.error('Error fetching currencies:', {
        error,
        status: error?.response?.status,
        data: error?.response?.data,
        message: errorMessage,
      })

      throw err
    } finally {
      // Always reset loading state, even if aborted
      set({ isLoading: false })
    }
  },

  setCurrencies: (currencies) => set({ currencies }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearCurrencies: () => set({ currencies: [], error: null }),
}))

