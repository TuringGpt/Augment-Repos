import { create } from 'zustand'
import type { CreateContactRequest, CreateContactResponse } from '@services/api/contact/contactService'

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
    // Import contactService dynamically to avoid circular dependency
    const { contactService } = await import('@services/api/contact/contactService')

    try {
      set({ isSubmitting: true, error: null, lastSubmittedContact: null })

      const response = await contactService.createContact(data)

      set({ lastSubmittedContact: response, error: null })

      return response
    } catch (err) {
      const error = err as {
        response?: {
          status?: number
          statusText?: string
          data?: { message?: string }
        }
        message?: string
        name?: string
      }

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit contact form. Please try again.'

      set({ error: errorMessage })
      // Log only non-PII fields to avoid exposing sensitive user content
      console.error('Error submitting contact form:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        errorType: error?.name,
        message: errorMessage,
      })

      throw err
    } finally {
      set({ isSubmitting: false })
    }
  },

  clearError: () => set({ error: null }),

  clearLastSubmitted: () => set({ lastSubmittedContact: null }),
}))

