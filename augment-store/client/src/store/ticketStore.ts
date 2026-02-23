import { create } from 'zustand'
import { ticketService } from '@services/api'
import type { TicketListItem, TicketFilterParams } from '@features/support/types'

interface TicketState {
  tickets: TicketListItem[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null

  // Actions
  fetchTickets: (params?: TicketFilterParams) => Promise<void>
  clearTickets: () => void
  setPage: (page: number) => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: false,
  error: null,

  fetchTickets: async (params?: TicketFilterParams) => {
    const state = get()
    const currentPage = params?.page ?? state.page

    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    set({ isLoading: true, error: null })

    try {
      const response = await ticketService.getTickets({
        ...params,
        page: currentPage,
      })

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === fetchRequestCounter) {
        // Calculate total pages using backend page size (configured in Django REST_FRAMEWORK settings)
        const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings
        const calculatedTotalPages = Math.ceil(response.count / backendPageSize)

        set({
          tickets: response.results,
          total: response.count,
          page: currentPage,
          totalPages: calculatedTotalPages,
          isLoading: false,
        })
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      if (requestId === fetchRequestCounter) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch tickets',
          isLoading: false,
        })
      }
    }
  },

  clearTickets: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchRequestCounter += 1

    set({
      tickets: [],
      total: 0,
      page: 1,
      totalPages: 0,
      isLoading: false,
      error: null,
    })
  },

  setPage: (page: number) => {
    set({ page })
    get().fetchTickets({ page })
  },
}))

