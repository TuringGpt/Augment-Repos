import { create } from 'zustand'
import type { Currency, CreateCurrencyRequest, UpdateCurrencyRequest } from '@services/api'
import { isAbortError, parseApiError, sanitizeErrorForLogging, SupersededRequestError } from '@utils/errorUtils'

interface CurrencyState {
  currencies: Currency[]
  isLoading: boolean
  error: string | null
  isCreating: boolean
  createError: string | null
  isUpdating: boolean
  updateError: string | null
  isDeleting: boolean
  deleteError: string | null

  // Actions
  fetchCurrencies: (signal?: AbortSignal) => Promise<void>
  createCurrency: (data: CreateCurrencyRequest, signal?: AbortSignal) => Promise<void>
  updateCurrency: (id: string, data: UpdateCurrencyRequest) => Promise<void>
  deleteCurrency: (id: string) => Promise<void>
  setCurrencies: (currencies: Currency[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearCurrencies: () => void
}

// Request counters to track the latest requests
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0
let createRequestCounter = 0
let updateRequestCounter = 0
let deleteRequestCounter = 0

// Track locally-deleted currency IDs to prevent stale fetched data from reintroducing deleted currencies
// When deleteCurrency completes, the currency ID is added to this set
// When fetchCurrencies or createCurrency updates state, they filter out currencies that are in this set
// This prevents race conditions where a fetchCurrencies/createCurrency request started before deleteCurrency
// completes after deleteCurrency and reintroduces the deleted currency back into the store
const locallyDeletedCurrencyIds = new Set<string>()

export const useCurrencyStore = create<CurrencyState>((set) => ({
  // Initial state
  currencies: [],
  isLoading: false,
  error: null,
  isCreating: false,
  createError: null,
  isUpdating: false,
  updateError: null,
  isDeleting: false,
  deleteError: null,

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
        // Filter out locally-deleted currencies to prevent race conditions
        // This prevents stale fetched data from reintroducing deleted currencies
        // when a fetchCurrencies request started before deleteCurrency completes after it
        const filteredCurrencies = currencies.filter(currency => !locallyDeletedCurrencyIds.has(currency.id))
        set({ currencies: filteredCurrencies, error: null, isLoading: false })
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

    // Capture the current deleteRequestCounter at the start of this create
    // This allows us to detect if a deleteCurrency() call occurred while this create was in-flight
    // preventing us from re-introducing a deleted currency in the refetched list
    const deleteCounterAtCreateStart = deleteRequestCounter

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
        // Check if a deleteCurrency() call occurred while this create was in-flight
        // If so, this check prevents us from re-introducing the deleted currency via the refetched list
        // Note: deleteCurrency() bumps deleteRequestCounter (not createRequestCounter)
        if (deleteRequestCounter !== deleteCounterAtCreateStart) {
          // A delete occurred while this create was in-flight
          // Only reset isCreating state if this is still the latest request
          // This prevents an older request from clearing isCreating while a newer createCurrency() is still in-flight
          if (requestId === createRequestCounter) {
            set({ isCreating: false })
          }
          // Throw error to signal that this request was invalidated by a delete
          // This prevents re-introducing a deleted currency and avoids showing success toasts
          throw new SupersededRequestError('Currency creation was invalidated by a concurrent deletion')
        }

        // Invalidate ALL in-flight fetchCurrencies() requests that started before this refetch completed
        // This includes fetches that started before AND during this create operation
        // to prevent them from overwriting the just-created currency list with stale data
        // Note: We don't check if fetchRequestCounter changed because a fetch that started during
        // the create (after we started but before we refetched) could still return stale data
        fetchRequestCounter += 1
        // Clear isLoading to prevent UI from being stuck in loading state
        // When we increment fetchRequestCounter, any in-flight fetchCurrencies() will be invalidated
        // and won't clear isLoading (see line 56-58), potentially leaving the UI stuck
        // with disabled refresh button
        set({ isLoading: false })

        // Filter out locally-deleted currencies to prevent race conditions
        // This prevents stale refetched data from reintroducing deleted currencies
        // when a deleteCurrency call completes while this createCurrency was in-flight
        const filteredCurrencies = currencies.filter(currency => !locallyDeletedCurrencyIds.has(currency.id))
        set({ currencies: filteredCurrencies, createError: null, isCreating: false, error: null })
      } else {
        // Only reset isCreating state if this is still the latest request
        // This prevents an older request from clearing isCreating while a newer createCurrency() is still in-flight
        if (requestId === createRequestCounter) {
          set({ isCreating: false })
        }
        // Throw error to signal to the caller that this request was superseded
        // This prevents callers from showing success toasts for stale/ignored results
        throw new SupersededRequestError('Currency creation was superseded by a newer request')
      }
    } catch (err) {
      // Handle SupersededRequestError - this is thrown when the request is invalidated
      // by a delete or newer create. We need to reset isCreating before re-throwing.
      if (err instanceof SupersededRequestError) {
        // Only reset isCreating state if this is still the latest request
        // This prevents an older request from clearing isCreating while a newer createCurrency() is still in-flight
        if (requestId === createRequestCounter) {
          set({ isCreating: false })
        }
        throw err
      }

      // Handle abort errors - these are expected when component unmounts or request is cancelled
      if (isAbortError(err)) {
        console.log('Currency create/refetch aborted')
        // Only reset loading state if this is still the latest request
        if (requestId === createRequestCounter) {
          set({ isCreating: false })
        }
        // Re-throw the error to signal to the caller that the operation was aborted
        // This prevents callers from showing success toasts for aborted operations
        throw err
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

        // Re-throw with the parsed error message so callers can display it (e.g., in toast notifications)
        // This ensures callers using `catch (e) => toast(e.message)` show the user-friendly parsed message
        // instead of the raw technical error message from the original exception
        // Only throw if this is still the latest request to avoid noisy/unhandled promise rejections
        // from stale/invalidated requests
        throw new Error(errorMessage)
      } else {
        // Only reset isCreating state if this is still the latest request
        // This prevents an older request from clearing isCreating while a newer createCurrency() is still in-flight
        if (requestId === createRequestCounter) {
          set({ isCreating: false })
        }
        // Throw SupersededRequestError to signal to the caller that this request was superseded
        // This prevents callers from showing error toasts for stale/ignored requests
        throw new SupersededRequestError('Currency creation was superseded by a newer request')
      }
    }
  },

  updateCurrency: async (id: string, data: UpdateCurrencyRequest) => {
    // Use separate isUpdating/updateError state to avoid race conditions with fetchCurrencies
    // This prevents updateCurrency from clearing error or setting isLoading to false
    // while a fetchCurrencies request is still in-flight

    updateRequestCounter += 1
    const requestId = updateRequestCounter



    set({ isUpdating: true, updateError: null })

    try {
      // Import currencyService dynamically to avoid circular dependency
      const { currencyService } = await import('@services/api')

      // Update the currency
      // Note: updateCurrency API doesn't support AbortSignal, so we cannot abort the update itself
      await currencyService.updateCurrency(id, data)

      // Refetch currencies to get the updated list with the modified currency
      // Note: The update endpoint returns only basic fields (code, name, symbol)
      // without id, created_at, and updated_at, so we need to refetch to get the complete data
      // Don't pass AbortSignal to refetch because the update itself cannot be aborted
      // If we allowed aborting the refetch after a successful update, callers would
      // incorrectly treat the successful update as failed/cancelled
      const currencies = await currencyService.getCurrencies()

      // Only update state if this is still the latest request
      // This check protects against race conditions where clearCurrencies() or a newer
      // updateCurrency() call invalidates this request while in-flight
      if (requestId === updateRequestCounter) {
        // Check if the currency being updated was successfully deleted while this update was in-flight
        // Only check locallyDeletedCurrencyIds (which contains IDs of successfully deleted currencies)
        // instead of deleteRequestCounter (which increments when delete starts, even if it later fails)
        // This prevents skipping the update when a delete fails, ensuring the store stays up-to-date
        if (locallyDeletedCurrencyIds.has(id)) {
          // The currency was successfully deleted while this update was in-flight
          // Only reset isUpdating state if this is still the latest request
          // This prevents an older request from clearing isUpdating while a newer updateCurrency() is still in-flight
          if (requestId === updateRequestCounter) {
            set({ isUpdating: false })
          }
          // Throw error to signal that this request was invalidated by a successful delete
          // This prevents re-introducing a deleted currency and avoids showing success toasts
          throw new SupersededRequestError('Currency update was invalidated by a concurrent deletion')
        }

        // Invalidate ALL in-flight fetchCurrencies() requests that started before this refetch completed
        // This includes fetches that started before AND during this update operation
        // to prevent them from overwriting the just-updated currency list with stale pre-update data
        // Note: We don't check if fetchRequestCounter changed because a fetch that started during
        // the update (after we started but before we refetched) could still return stale data
        fetchRequestCounter += 1
        // Clear isLoading to prevent UI from being stuck in loading state
        // When we increment fetchRequestCounter, any in-flight fetchCurrencies() will be invalidated
        // and won't clear isLoading (see line 56-58), potentially leaving the UI stuck
        // with disabled refresh button
        set({ isLoading: false })

        // Filter out locally-deleted currencies to prevent race conditions
        // This prevents stale refetched data from reintroducing deleted currencies
        // when a deleteCurrency call completes while this updateCurrency was in-flight
        const filteredCurrencies = currencies.filter(currency => !locallyDeletedCurrencyIds.has(currency.id))
        set({ currencies: filteredCurrencies, updateError: null, isUpdating: false, error: null })
      } else {
        // Only reset isUpdating state if this is still the latest request
        // This prevents an older request from clearing isUpdating while a newer updateCurrency() is still in-flight
        if (requestId === updateRequestCounter) {
          set({ isUpdating: false })
        }
        // Throw error to signal to the caller that this request was superseded
        // This prevents callers from showing success toasts for stale/ignored results
        throw new SupersededRequestError('Currency update was superseded by a newer request')
      }
    } catch (err) {
      // Handle SupersededRequestError - this is thrown when the request is invalidated
      // by a delete or newer update. We need to reset isUpdating before re-throwing.
      if (err instanceof SupersededRequestError) {
        // Only reset isUpdating state if this is still the latest request
        // This prevents an older request from clearing isUpdating while a newer updateCurrency() is still in-flight
        if (requestId === updateRequestCounter) {
          set({ isUpdating: false })
        }
        throw err
      }

      // Handle abort errors - these are expected when component unmounts or request is cancelled
      if (isAbortError(err)) {
        console.log('Currency update/refetch aborted')
        // Only reset loading state if this is still the latest request
        if (requestId === updateRequestCounter) {
          set({ isUpdating: false })
        }
        // Re-throw the error to signal to the caller that the operation was aborted
        // This prevents callers from showing success toasts for aborted operations
        throw err
      }

      // Use parseApiError to extract user-friendly error message from API response
      // Pass field names to extract field-specific DRF validation errors (e.g., { code: [...], name: [...] })
      // This properly handles Django/DRF error responses including:
      // - detail field (common for validation errors like duplicates)
      // - field-specific errors (code, name, symbol)
      // - non_field_errors
      const errorMessage = parseApiError(err, {
        fieldNames: ['code', 'name', 'symbol'],
        defaultMessage: 'Failed to update currency. Please try again.',
      })

      // Only update error state if this is still the latest request
      if (requestId === updateRequestCounter) {
        set({ updateError: errorMessage, isUpdating: false })

        // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
        console.error('Error updating currency:', sanitizeErrorForLogging(err, 'Failed to update currency'))

        // Re-throw with the parsed error message so callers can display it (e.g., in toast notifications)
        // This ensures callers using `catch (e) => toast(e.message)` show the user-friendly parsed message
        // instead of the raw technical error message from the original exception
        // Only throw if this is still the latest request to avoid noisy/unhandled promise rejections
        // from stale/invalidated requests
        throw new Error(errorMessage)
      } else {
        // Only reset isUpdating state if this is still the latest request
        // This prevents an older request from clearing isUpdating while a newer updateCurrency() is still in-flight
        if (requestId === updateRequestCounter) {
          set({ isUpdating: false })
        }
        // Throw SupersededRequestError to signal to the caller that this request was superseded
        // This prevents callers from showing error toasts for stale/ignored requests
        throw new SupersededRequestError('Currency update was superseded by a newer request')
      }
    }
  },

  deleteCurrency: async (id: string) => {
    // Increment counter and capture the current request ID
    // This prevents a slow/failed earlier delete from overwriting deleteError/isDeleting
    // from a newer delete operation
    deleteRequestCounter += 1
    const requestId = deleteRequestCounter

    // Capture the current fetchRequestCounter at the start of this delete
    // This allows us to invalidate only fetchCurrencies() calls that started BEFORE this delete
    // preventing invalidation of newer fetches that started after this delete began
    const fetchCounterAtDeleteStart = fetchRequestCounter

    // Capture the current createRequestCounter at the start of this delete
    // This allows us to invalidate only createCurrency() calls that started BEFORE this delete
    // preventing invalidation of newer creates that started after this delete began
    const createCounterAtDeleteStart = createRequestCounter

    set({ isDeleting: true, deleteError: null })

    try {
      // Import currencyService dynamically to avoid circular dependency
      const { currencyService } = await import('@services/api')

      // Call the API to delete the currency
      await currencyService.deleteCurrency(id)

      // Add the deleted currency ID to the set to prevent race conditions
      // This ensures that any in-flight fetchCurrencies() or createCurrency() requests
      // that started before this delete will filter out this currency when they complete,
      // preventing the deleted currency from being reintroduced into the store
      locallyDeletedCurrencyIds.add(id)

      // Only invalidate in-flight fetchCurrencies() requests that started BEFORE this delete
      // to prevent them from overwriting state with a stale list that re-introduces the deleted currency
      // Only invalidate if no newer fetch has started (fetchRequestCounter hasn't changed)
      // This prevents invalidating user-triggered refreshes that started after this delete
      if (fetchRequestCounter === fetchCounterAtDeleteStart) {
        fetchRequestCounter += 1
        // Clear isLoading to prevent UI from being stuck in loading state
        // When we increment fetchRequestCounter, any in-flight fetchCurrencies() will be invalidated
        // and won't clear isLoading (see line 56-58), potentially leaving the UI stuck
        // with disabled refresh button
        set({ isLoading: false })
      }

      // Only invalidate in-flight createCurrency() requests that started BEFORE this delete
      // to prevent them from overwriting state with a stale list that re-introduces the deleted currency
      // Only invalidate if no newer create has started (createRequestCounter hasn't changed)
      // This prevents invalidating user-triggered creates that started after this delete
      if (createRequestCounter === createCounterAtDeleteStart) {
        createRequestCounter += 1
      }

      // ALWAYS remove the successfully deleted currency from local state
      // Even if this request was superseded by a newer delete (different currency),
      // the API call succeeded so we must update the UI to reflect the deletion
      // This prevents stale UI where a currency remains visible after successful deletion
      set((state) => ({
        currencies: state.currencies.filter((currency) => currency.id !== id),
        // Only update loading/error state if this is still the latest delete request
        // This prevents a slow earlier delete from overwriting state from a newer delete
        ...(requestId === deleteRequestCounter
          ? { isDeleting: false, deleteError: null, error: null }
          : {}),
      }))

      // If this request was superseded, throw error to signal to the caller
      // This prevents callers from showing success toasts for stale/ignored results
      if (requestId !== deleteRequestCounter) {
        throw new SupersededRequestError('Currency deletion was superseded by a newer request')
      }
    } catch (err) {
      // Use parseApiError to extract user-friendly error message from API response
      const errorMessage = parseApiError(err, {
        defaultMessage: 'Failed to delete currency. Please try again.',
      })

      // Only update error state if this is still the latest delete request
      // This prevents a slow/failed earlier delete from overwriting deleteError/isDeleting
      // from a newer delete that may have already succeeded
      if (requestId === deleteRequestCounter) {
        set({ deleteError: errorMessage, isDeleting: false })

        // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
        console.error('Error deleting currency:', sanitizeErrorForLogging(err, 'Failed to delete currency'))

        // Re-throw with the parsed error message so callers can display it (e.g., in toast notifications)
        throw new Error(errorMessage)
      } else {
        // Throw SupersededRequestError to signal to the caller that this request was superseded
        // This prevents callers from showing error toasts for stale/ignored requests
        throw new SupersededRequestError('Currency deletion was superseded by a newer request')
      }
    }
  },

  setCurrencies: (currencies) => set({ currencies }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearCurrencies: () => {
    // Increment all counters to invalidate any in-flight fetch, create, update, or delete requests
    // This ensures that in-flight fetchCurrencies(), createCurrency(), updateCurrency(), or deleteCurrency() calls won't update
    // state after it has been cleared (e.g., during logout/navigation)
    fetchRequestCounter += 1
    createRequestCounter += 1
    updateRequestCounter += 1
    deleteRequestCounter += 1
    // Clear the locally-deleted currency IDs set to prevent memory leaks
    // and allow previously deleted currencies to be fetched again in future sessions
    locallyDeletedCurrencyIds.clear()
    // Reset all loading state to prevent being stuck in loading state if called during active requests
    set({ currencies: [], error: null, isLoading: false, createError: null, isCreating: false, updateError: null, isUpdating: false, deleteError: null, isDeleting: false })
  },
}))

