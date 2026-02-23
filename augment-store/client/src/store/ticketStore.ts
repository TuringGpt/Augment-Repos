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
  fetchTickets: (params?: TicketFilterParams, recursionDepth?: number) => Promise<void>
  clearTickets: () => void
  setPage: (page: number) => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

// Maximum recursion depth for out-of-range page handling
// Prevents excessive sequential requests when a far-out page is requested
const MAX_RECURSION_DEPTH = 1

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  lastFilters: {}, // Initialize with empty filters

  fetchTickets: async (params?: TicketFilterParams, recursionDepth = 0) => {
    const state = get()
    const currentPage = params?.page ?? state.page

    // Extract and save filter parameters (excluding page) for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page: _, ...filters } = params ?? {}

    // Only update lastFilters if new filter parameters are explicitly provided
    // This prevents overwriting existing filters when only page is changed
    // Note: We check if any filter keys exist (not their values) to allow clearing filters
    // with empty strings (e.g., { search: '' } or { status: '' } should clear those filters)
    const hasNewFilters = Object.keys(filters).some(
      (key) => {
        const value = filters[key as keyof typeof filters]
        // Consider a filter "new" if it's explicitly provided (even if empty string)
        // Only exclude undefined values, which indicate the filter wasn't provided at all
        return value !== undefined
      }
    )

    // When new filters are provided, merge them with lastFilters to allow partial updates
    // Empty strings will override previous values, effectively clearing those filters
    // This allows callers to update one filter (e.g., status) without affecting others (e.g., search)
    // and also allows clearing filters by passing empty strings
    const updatedFilters = hasNewFilters ? { ...state.lastFilters, ...filters } : state.lastFilters

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
          // Fallback: count > 0 but results empty (out-of-range page)
          // We don't know the backend page size, so we can't accurately calculate total pages
          // Instead, set calculatedTotalPages to ensure we trigger a refetch to a valid page
          // Setting it to currentPage - 1 guarantees validPage < currentPage, triggering the refetch
          calculatedTotalPages = Math.max(1, currentPage - 1)
        }

        // Clamp currentPage to valid range [1, totalPages] to prevent invalid pagination state
        // This can happen when filters/deletions reduce count and currentPage exceeds totalPages
        const validPage = Math.max(1, Math.min(currentPage, calculatedTotalPages))

        // If the requested page was out of range and we have tickets, refetch the valid page
        // Use recursion depth limit to prevent excessive sequential requests for far-out pages
        if (validPage !== currentPage && calculatedTotalPages > 0 && recursionDepth < MAX_RECURSION_DEPTH) {
          return await get().fetchTickets({ ...updatedFilters, page: validPage }, recursionDepth + 1)
        }

        // When recursion limit is hit, we keep the data from currentPage (even if out of range)
        // So we must set page to currentPage to match the displayed data, not validPage
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
      totalPages: 1,
      isLoading: false,
      error: null,
      lastFilters: {}, // Reset filters when clearing tickets
    })
  },

  setPage: (page: number) => {
    const state = get()
    // Don't update page state here - let fetchTickets update it on success
    // This prevents page/tickets mismatch if the fetch fails
    // Preserve last-used filters when changing pages
    get().fetchTickets({ ...state.lastFilters, page })
  },
}))

