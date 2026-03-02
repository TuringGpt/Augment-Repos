import { create } from 'zustand'
import type { CreateContactRequest, CreateContactResponse, ContactListResponse, UpdateContactRequest, UpdateContactResponse } from '@services/api/contact/contactService'
import { parseApiError } from '@utils/errorUtils'

// Request counter to prevent race conditions when submitting contact form
// When multiple submit calls are made in quick succession (e.g., double-click),
// only the most recent request should update the state
let submitRequestCounter = 0

// Request counter to prevent race conditions when fetching contacts
// When multiple fetch calls are made in quick succession,
// only the most recent request should update the state
let fetchRequestCounter = 0

// Request counter to prevent race conditions when updating contacts
// When multiple update calls are made in quick succession,
// only the most recent request should update the state
let updateRequestCounter = 0

interface ContactState {
  // Loading states
  isSubmitting: boolean
  isLoading: boolean
  isUpdating: boolean

  // Error states
  error: string | null
  fetchError: string | null
  updateError: string | null

  // Success state
  lastSubmittedContact: CreateContactResponse | null
  lastUpdatedContact: UpdateContactResponse | null

  // Data state
  contacts: ContactListResponse | null

  // Actions
  submitContact: (data: CreateContactRequest) => Promise<CreateContactResponse>
  getContacts: () => Promise<void>
  updateContact: (id: string, data: UpdateContactRequest) => Promise<UpdateContactResponse>
  clearError: () => void
  clearFetchError: () => void
  clearUpdateError: () => void
  clearLastSubmitted: () => void
  clearLastUpdated: () => void
  clearContacts: () => void
}

export const useContactStore = create<ContactState>((set) => ({
  // Initial state
  isSubmitting: false,
  isLoading: false,
  isUpdating: false,
  error: null,
  fetchError: null,
  updateError: null,
  lastSubmittedContact: null,
  lastUpdatedContact: null,
  contacts: null,

  // Actions
  submitContact: async (data: CreateContactRequest) => {
    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    submitRequestCounter += 1
    const currentRequestId = submitRequestCounter

    // Set loading state and clear stale data BEFORE any awaited work
    set({ isSubmitting: true, error: null, lastSubmittedContact: null })

    try {
      // Import contactService dynamically to avoid circular dependency
      const { contactService } = await import('@services/api/contact/contactService')

      const response = await contactService.createContact(data)

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === submitRequestCounter) {
        set({ lastSubmittedContact: response, error: null })
      }

      return response
    } catch (err) {
      // Use parseApiError to handle DRF/Axios errors with proper priority order
      const errorMessage = parseApiError(err, {
        fieldNames: ['name', 'email', 'subject', 'message'],
        defaultMessage: 'Failed to submit contact form. Please try again.',
      })

      // Only update error state if this is still the most recent request
      if (currentRequestId === submitRequestCounter) {
        set({ error: errorMessage })
      }

      // Log only non-PII fields to avoid exposing sensitive user content
      const error = err as {
        response?: {
          status?: number
          statusText?: string
        }
        name?: string
      }
      console.error('Error submitting contact form:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        errorType: error?.name,
        message: errorMessage,
      })

      throw err
    } finally {
      // Only clear loading state if this is still the most recent request
      if (currentRequestId === submitRequestCounter) {
        set({ isSubmitting: false })
      }
    }
  },

  clearError: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the error state
    submitRequestCounter += 1
    // Always reset isSubmitting to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ error: null, isSubmitting: false })
  },

  clearLastSubmitted: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the success state
    submitRequestCounter += 1
    // Always reset isSubmitting to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ lastSubmittedContact: null, isSubmitting: false })
  },

  getContacts: async () => {
    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    fetchRequestCounter += 1
    const currentRequestId = fetchRequestCounter

    // Set loading state and clear any previous errors BEFORE any awaited work
    // Note: contacts are kept to show previous data while reloading
    set({ isLoading: true, fetchError: null })

    try {
      // Import contactService dynamically to avoid circular dependency
      const { contactService } = await import('@services/api/contact/contactService')

      const response = await contactService.getContacts()

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === fetchRequestCounter) {
        set({ contacts: response, fetchError: null })
      }
    } catch (err) {
      // Use parseApiError to handle DRF/Axios errors with proper priority order
      const errorMessage = parseApiError(err, {
        defaultMessage: 'Failed to fetch contacts. Please try again.',
      })

      // Only update error state if this is still the most recent request
      if (currentRequestId === fetchRequestCounter) {
        set({ fetchError: errorMessage })
      }

      // Log error for debugging
      const error = err as {
        response?: {
          status?: number
          statusText?: string
        }
        name?: string
      }
      console.error('Error fetching contacts:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        errorType: error?.name,
        message: errorMessage,
      })

      // Do not rethrow - error is already persisted to store state
      // This prevents unhandled promise rejections when called from useEffect without await/catch
    } finally {
      // Only clear loading state if this is still the most recent request
      if (currentRequestId === fetchRequestCounter) {
        set({ isLoading: false })
      }
    }
  },

  clearFetchError: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the error state
    fetchRequestCounter += 1
    // Always reset isLoading to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ fetchError: null, isLoading: false })
  },

  clearContacts: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the contacts state
    fetchRequestCounter += 1
    // Always reset isLoading to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ contacts: null, fetchError: null, isLoading: false })
  },

  updateContact: async (id: string, data: UpdateContactRequest) => {
    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    updateRequestCounter += 1
    const currentRequestId = updateRequestCounter

    // Set loading state and clear stale data BEFORE any awaited work
    set({ isUpdating: true, updateError: null, lastUpdatedContact: null })

    try {
      // Import contactService dynamically to avoid circular dependency
      const { contactService } = await import('@services/api/contact/contactService')

      const response = await contactService.updateContact(id, data)

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === updateRequestCounter) {
        set({ lastUpdatedContact: response, updateError: null })

        // Update the contact in the contacts list if it exists
        set((state) => {
          if (state.contacts) {
            return {
              contacts: {
                ...state.contacts,
                results: state.contacts.results.map((contact) =>
                  contact.id === id ? response : contact
                ),
              },
            }
          }
          return {}
        })
      }

      return response
    } catch (err) {
      // Use parseApiError to handle DRF/Axios errors with proper priority order
      const errorMessage = parseApiError(err, {
        fieldNames: ['name', 'email', 'subject', 'message', 'status'],
        defaultMessage: 'Failed to update contact. Please try again.',
      })

      // Only update error state if this is still the most recent request
      if (currentRequestId === updateRequestCounter) {
        set({ updateError: errorMessage })
      }

      // Log only non-PII fields to avoid exposing sensitive user content
      const error = err as {
        response?: {
          status?: number
          statusText?: string
        }
        name?: string
      }
      console.error('Error updating contact:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        errorType: error?.name,
        message: errorMessage,
      })

      throw err
    } finally {
      // Only clear loading state if this is still the most recent request
      if (currentRequestId === updateRequestCounter) {
        set({ isUpdating: false })
      }
    }
  },

  clearUpdateError: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the error state
    updateRequestCounter += 1
    // Always reset isUpdating to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ updateError: null, isUpdating: false })
  },

  clearLastUpdated: () => {
    // Invalidate any in-flight requests by incrementing the counter
    // This ensures late-resolving requests won't repopulate the success state
    updateRequestCounter += 1
    // Always reset isUpdating to prevent it from being stuck in true state
    // if this is called while a request is in-flight
    set({ lastUpdatedContact: null, isUpdating: false })
  },
}))

