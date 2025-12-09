import { create } from 'zustand'
import { newsletterService } from '@services/api'
import type { NewsletterAPI, SubscribeNewsletterRequest } from '@services/api/newsletter/newsletterService'

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

  // Actions
  fetchNewsletters: (page?: number) => Promise<void>
  clearNewsletters: () => void
  setPage: (page: number) => void
  subscribe: (data: SubscribeNewsletterRequest) => Promise<void>
  clearSubscribeState: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

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

  fetchNewsletters: async (page?: number) => {
    const state = get()
    const currentPage = page ?? state.page

    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    set({ isLoading: true, error: null })
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
      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch newsletters',
          isLoading: false,
        })
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
    })
  },

  setPage: (page: number) => {
    set({ page })
    get().fetchNewsletters(page)
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
      set({
        subscribeError: error instanceof Error ? error.message : 'Failed to subscribe to newsletter',
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
}))

