import { create } from 'zustand'
import { newsletterService } from '@services/api'
import type { NewsletterAPI, SubscribeNewsletterRequest, UnsubscribeNewsletterRequest, UnsubscribeNewsletterByEmailRequest } from '@services/api/newsletter/newsletterService'
import { parseApiError, sanitizeErrorForLogging } from '@utils/errorUtils'

interface NewsletterState {
  newsletters: NewsletterAPI[]
  total: number
  page: number
  limit: number
  totalPages: number
  isLoading: boolean
  error: string | null
  isSubscribing: boolean
  subscribeError: string | null
  subscribeSuccess: boolean
  isUnsubscribing: boolean
  unsubscribeError: string | null
  unsubscribeSuccess: boolean
  isAdminMode: boolean
  currentNewsletter: NewsletterAPI | null
  isFetchingById: boolean
  fetchByIdError: string | null

  // Actions
  fetchNewsletters: (page?: number) => Promise<void>
  fetchAdminNewsletters: (page?: number) => Promise<void>
  fetchAdminNewsletterById: (id: string) => Promise<void>
  clearNewsletters: () => void
  setPage: (page: number) => void
  subscribe: (data: SubscribeNewsletterRequest) => Promise<void>
  clearSubscribeState: () => void
  unsubscribe: (id: string, data?: UnsubscribeNewsletterRequest) => Promise<void>
  unsubscribeByEmailPatch: (data: UnsubscribeNewsletterByEmailRequest) => Promise<void>
  unsubscribeByEmailPut: (data: UnsubscribeNewsletterByEmailRequest) => Promise<void>
  clearUnsubscribeState: () => void
  clearCurrentNewsletter: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

// Request counter to track the latest fetch-by-id request
// Prevents stale responses from overwriting newer state or repopulating after clear
let fetchByIdRequestCounter = 0

export const useNewsletterStore = create<NewsletterState>((set, get) => ({
  newsletters: [],
  total: 0,
  page: 1,
  limit: 100, // Backend has fixed page_size of 100
  totalPages: 0,
  isLoading: false,
  error: null,
  isSubscribing: false,
  subscribeError: null,
  subscribeSuccess: false,
  isUnsubscribing: false,
  unsubscribeError: null,
  unsubscribeSuccess: false,
  isAdminMode: false,
  currentNewsletter: null,
  isFetchingById: false,
  fetchByIdError: null,

  fetchNewsletters: async (page?: number) => {
    const state = get()
    const currentPage = page ?? state.page

    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    // Set isAdminMode to false to indicate we're using the regular endpoint
    set({ isLoading: true, error: null, isAdminMode: false })
    try {
      const response = await newsletterService.getNewsletters(currentPage)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === fetchRequestCounter) {
        set({
          newsletters: response.newsletters,
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
          isLoading: false,
        })
      }
    } catch (error) {
      // Log the error for debugging
      console.error('Failed to fetch newsletters:', error)

      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        // Use parseApiError to get a user-friendly message
        // Note: The actual user-facing message will be translated in the component
        const errorMessage = parseApiError(error, {
          defaultMessage: 'NEWSLETTER_FETCH_ERROR', // Error key for component to translate
        })

        set({
          error: errorMessage,
          isLoading: false,
        })
      }
    }
  },

  fetchAdminNewsletters: async (page?: number) => {
    const state = get()
    const currentPage = page ?? state.page

    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    // Set isAdminMode to true to indicate we're using the admin endpoint
    set({ isLoading: true, error: null, isAdminMode: true })
    try {
      const response = await newsletterService.getAdminNewsletters(currentPage)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === fetchRequestCounter) {
        set({
          newsletters: response.newsletters,
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
          isLoading: false,
        })
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        // Use parseApiError to get a user-friendly message
        // Note: The actual user-facing message will be translated in the component
        const errorMessage = parseApiError(error, {
          defaultMessage: 'NEWSLETTER_FETCH_ERROR', // Error key for component to translate
        })

        set({
          error: errorMessage,
          isLoading: false,
        })

        // Log only sanitized error information to avoid leaking sensitive data
        // (e.g., Authorization headers in Axios config)
        console.error('Failed to fetch admin newsletters:', sanitizeErrorForLogging(error))
      }
    }
  },

  fetchAdminNewsletterById: async (id: string) => {
    // Increment counter and capture the current request ID
    fetchByIdRequestCounter += 1
    const requestId = fetchByIdRequestCounter

    set({ isFetchingById: true, fetchByIdError: null, currentNewsletter: null })
    try {
      const newsletter = await newsletterService.getAdminNewsletterById(id)

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === fetchByIdRequestCounter) {
        set({
          currentNewsletter: newsletter,
          isFetchingById: false,
        })
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      if (requestId === fetchByIdRequestCounter) {
        // Use parseApiError to get a user-friendly message
        // Note: The actual user-facing message will be translated in the component
        const errorMessage = parseApiError(error, {
          defaultMessage: 'NEWSLETTER_FETCH_BY_ID_ERROR', // Error key for component to translate
        })

        set({
          fetchByIdError: errorMessage,
          isFetchingById: false,
          currentNewsletter: null,
        })

        // Log only sanitized error information to avoid leaking sensitive data
        // (e.g., Authorization headers in Axios config)
        console.error('Failed to fetch admin newsletter by ID:', sanitizeErrorForLogging(error))
      }
    }
  },

  clearNewsletters: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchRequestCounter += 1

    set({
      newsletters: [],
      total: 0,
      page: 1,
      totalPages: 0,
      isLoading: false,
      error: null,
      isAdminMode: false,
    })
  },

  setPage: (page: number) => {
    const state = get()
    set({ page })
    // Use isAdminMode to determine which fetch function to use
    // This prevents admin views from accidentally calling the wrong endpoint when paging
    if (state.isAdminMode) {
      state.fetchAdminNewsletters(page)
    } else {
      state.fetchNewsletters(page)
    }
  },

  subscribe: async (data: SubscribeNewsletterRequest) => {
    set({ isSubscribing: true, subscribeError: null, subscribeSuccess: false })
    try {
      await newsletterService.subscribe(data)
      set({
        isSubscribing: false,
        subscribeSuccess: true,
      })
    } catch (error) {
      // Log the error for debugging
      console.error('Failed to subscribe to newsletter:', error)

      // Use parseApiError to get a user-friendly message
      // Note: The actual user-facing message will be translated in the component
      const errorMessage = parseApiError(error, {
        fieldNames: ['email'],
        defaultMessage: 'NEWSLETTER_SUBSCRIBE_ERROR', // Error key for component to translate
      })

      set({
        subscribeError: errorMessage,
        isSubscribing: false,
        subscribeSuccess: false,
      })
      throw error
    }
  },

  clearSubscribeState: () => {
    set({
      isSubscribing: false,
      subscribeError: null,
      subscribeSuccess: false,
    })
  },

  unsubscribe: async (id: string, data?: UnsubscribeNewsletterRequest) => {
    set({ isUnsubscribing: true, unsubscribeError: null, unsubscribeSuccess: false })
    try {
      await newsletterService.unsubscribe(id, data)
      set({
        isUnsubscribing: false,
        unsubscribeSuccess: true,
      })
    } catch (error) {
      // Log the error for debugging
      console.error('Failed to unsubscribe from newsletter:', error)

      // Use parseApiError to get a user-friendly message
      // Note: The actual user-facing message will be translated in the component
      const errorMessage = parseApiError(error, {
        fieldNames: ['email'],
        defaultMessage: 'NEWSLETTER_UNSUBSCRIBE_ERROR', // Error key for component to translate
      })

      set({
        unsubscribeError: errorMessage,
        isUnsubscribing: false,
        unsubscribeSuccess: false,
      })
      throw error
    }
  },

  unsubscribeByEmailPatch: async (data: UnsubscribeNewsletterByEmailRequest) => {
    set({ isUnsubscribing: true, unsubscribeError: null, unsubscribeSuccess: false })
    try {
      await newsletterService.unsubscribeByEmailPatch(data)
      set({
        isUnsubscribing: false,
        unsubscribeSuccess: true,
      })
    } catch (error) {
      // Log the error for debugging
      console.error('Failed to unsubscribe from newsletter by email (PATCH):', error)

      // Use parseApiError to get a user-friendly message
      // Note: The actual user-facing message will be translated in the component
      const errorMessage = parseApiError(error, {
        fieldNames: ['email'],
        defaultMessage: 'NEWSLETTER_UNSUBSCRIBE_ERROR', // Error key for component to translate
      })

      set({
        unsubscribeError: errorMessage,
        isUnsubscribing: false,
        unsubscribeSuccess: false,
      })
      throw error
    }
  },

  unsubscribeByEmailPut: async (data: UnsubscribeNewsletterByEmailRequest) => {
    set({ isUnsubscribing: true, unsubscribeError: null, unsubscribeSuccess: false })
    try {
      await newsletterService.unsubscribeByEmailPut(data)
      set({
        isUnsubscribing: false,
        unsubscribeSuccess: true,
      })
    } catch (error) {
      // Log the error for debugging
      console.error('Failed to unsubscribe from newsletter by email (PUT):', error)

      // Use parseApiError to get a user-friendly message
      // Note: The actual user-facing message will be translated in the component
      const errorMessage = parseApiError(error, {
        fieldNames: ['email'],
        defaultMessage: 'NEWSLETTER_UNSUBSCRIBE_ERROR', // Error key for component to translate
      })

      set({
        unsubscribeError: errorMessage,
        isUnsubscribing: false,
        unsubscribeSuccess: false,
      })
      throw error
    }
  },

  clearUnsubscribeState: () => {
    set({
      isUnsubscribing: false,
      unsubscribeError: null,
      unsubscribeSuccess: false,
    })
  },

  clearCurrentNewsletter: () => {
    // Increment counter to invalidate any in-flight fetch-by-id requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchByIdRequestCounter += 1

    set({
      currentNewsletter: null,
      isFetchingById: false,
      fetchByIdError: null,
    })
  },
}))

