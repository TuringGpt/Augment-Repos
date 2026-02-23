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
        // Calculate total pages dynamically from response data
        // This handles backend pagination size changes and different environments
        let calculatedTotalPages: number

        if (response.count === 0) {
          // Edge case: empty results should show 1 page (not 0) for pagination UI compatibility
          calculatedTotalPages = 1
        } else if (response.results.length > 0) {
          // Derive page size from actual results length (works for all pages except possibly the last)
          // For the last page, this might underestimate, but we can use the presence of 'next' to refine
          const derivedPageSize = response.results.length

          // If there's a next page, we know we're not on the last page, so use derivedPageSize
          // If there's no next page, we're on the last page, so calculate based on total count
          if (response.next) {
            calculatedTotalPages = Math.ceil(response.count / derivedPageSize)
          } else {
            // On the last page: calculate page size from previous pages
            // totalPages = currentPage, and pageSize = count / (currentPage - 1) for previous pages
            // But simpler: if we're on last page, totalPages = currentPage
            calculatedTotalPages = currentPage
          }
        } else {
          // Fallback: shouldn't happen (count > 0 but results empty), but handle gracefully
          calculatedTotalPages = 1
        }

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

