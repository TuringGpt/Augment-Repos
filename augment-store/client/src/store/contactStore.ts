import { create } from 'zustand'
import type { CreateContactRequest, CreateContactResponse } from '@services/api/contact/contactService'
import { parseApiError } from '@utils/errorUtils'

// Request counter to prevent race conditions when submitting contact form
// When multiple submit calls are made in quick succession (e.g., double-click),
// only the most recent request should update the state
let submitRequestCounter = 0

interface ContactState {
  // Loading states
  isSubmitting: boolean

  // Error states
  error: string | null

  // Success state
  lastSubmittedContact: CreateContactResponse | null

  // Actions
  submitContact: (data: CreateContactRequest) => Promise<CreateContactResponse>
  clearError: () => void
  clearLastSubmitted: () => void
}

export const useContactStore = create<ContactState>((set) => ({
  // Initial state
  isSubmitting: false,
  error: null,
  lastSubmittedContact: null,

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

  clearError: () => set({ error: null }),

  clearLastSubmitted: () => set({ lastSubmittedContact: null }),
}))

