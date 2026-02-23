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
  lastFilters: Omit<TicketFilterParams, 'page'> // Store last-used filters (excluding page)

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
  lastFilters: {}, // Initialize with empty filters

  fetchTickets: async (params?: TicketFilterParams) => {
    const state = get()
    const currentPage = params?.page ?? state.page

    // Extract and save filter parameters (excluding page) for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page: _, ...filters } = params ?? {}

    // Only update lastFilters if new filter keys are explicitly provided
    // This prevents overwriting existing filters when only page is changed
    const hasNewFilters = Object.keys(filters).length > 0
    const updatedFilters = hasNewFilters ? filters : state.lastFilters

    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    set({ isLoading: true, error: null, lastFilters: updatedFilters })

    try {
      const response = await ticketService.getTickets({
        ...updatedFilters,
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

        // Clamp currentPage to valid range [1, totalPages] to prevent invalid pagination state
        // This can happen when filters/deletions reduce count and currentPage exceeds totalPages
        const validPage = Math.max(1, Math.min(currentPage, calculatedTotalPages))

        // If the requested page was out of range and we have tickets, refetch the valid page
        if (validPage !== currentPage && calculatedTotalPages > 0) {
          return await get().fetchTickets({ ...updatedFilters, page: validPage })
        }

        set({
          tickets: response.results,
          total: response.count,
          page: validPage,
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
      lastFilters: {}, // Reset filters when clearing tickets
    })
  },

  setPage: (page: number) => {
    const state = get()
    set({ page })
    // Preserve last-used filters when changing pages
    get().fetchTickets({ ...state.lastFilters, page })
  },
}))

