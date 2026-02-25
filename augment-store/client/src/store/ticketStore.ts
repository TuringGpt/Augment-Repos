import { create } from 'zustand'
import { ticketService } from '@services/api'
import { parseApiError } from '@utils/errorUtils'
import type { TicketListItem, TicketFilterParams, CreateTicketRequest, Ticket } from '@features/support/types'

interface TicketState {
  tickets: TicketListItem[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
  lastFilters: Omit<TicketFilterParams, 'page'> // Store last successfully fetched filters (excluding page)
  pendingFilters: Omit<TicketFilterParams, 'page'> // Store latest requested filters (even if in-flight)

  // Separate state for create ticket action to avoid race conditions with fetchTickets
  isCreating: boolean
  createError: string | null

  // Actions
  fetchTickets: (params?: TicketFilterParams, recursionDepth?: number) => Promise<void>
  clearTickets: () => void
  setPage: (page: number) => void
  createTicket: (data: CreateTicketRequest) => Promise<Ticket>
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

// Request counter to track the latest create ticket request
// Prevents race conditions when createTicket is triggered multiple times concurrently
let createRequestCounter = 0

// Maximum recursion depth for out-of-range page handling
// Prevents excessive sequential requests when a far-out page is requested
const MAX_RECURSION_DEPTH = 1

// Backend page size - fixed in Django REST_FRAMEWORK settings (server/core/settings.py)
// Used to calculate total pages when results are empty (out-of-range page)
const BACKEND_PAGE_SIZE = 100

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  lastFilters: {}, // Initialize with empty filters
  pendingFilters: {}, // Initialize with empty filters
  isCreating: false,
  createError: null,

  fetchTickets: async (params?: TicketFilterParams, recursionDepth = 0) => {
    const state = get()
    const currentPage = params?.page ?? state.page

    // Extract and save filter parameters (excluding page) for future use
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page: _, ...filters } = params ?? {}

    // Filter out undefined values to prevent them from overwriting lastFilters
    // Only keep keys with defined values (including empty strings, which are used to clear filters)
    const definedFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    ) as Omit<TicketFilterParams, 'page'>

    // Only update lastFilters if new filter parameters are explicitly provided
    // This prevents overwriting existing filters when only page is changed
    // Note: We check if any filter keys exist (not their values) to allow clearing filters
    // with empty strings (e.g., { search: '' } or { status: '' } should clear those filters)
    const hasNewFilters = Object.keys(definedFilters).length > 0

    // When new filters are provided, merge them with lastFilters to allow partial updates
    // Empty strings will override previous values, effectively clearing those filters
    // This allows callers to update one filter (e.g., status) without affecting others (e.g., search)
    // and also allows clearing filters by passing empty strings
    const updatedFilters = hasNewFilters ? { ...state.lastFilters, ...definedFilters } : state.lastFilters

    // Increment counter and capture the current request ID
    fetchRequestCounter += 1
    const requestId = fetchRequestCounter

    // Update pendingFilters immediately to prevent race conditions in setPage()
    // This ensures that if setPage() is called while this request is in-flight,
    // it will use the latest requested filters (not stale lastFilters)
    set({ isLoading: true, error: null, pendingFilters: updatedFilters })

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
          // Calculate total pages using the known backend page size
          // This ensures totalPages is always accurate regardless of which page is requested
          calculatedTotalPages = Math.ceil(response.count / BACKEND_PAGE_SIZE)
        }

        // Clamp currentPage to valid range [1, totalPages] to prevent invalid pagination state
        // This can happen when filters/deletions reduce count and currentPage exceeds totalPages
        const validPage = Math.max(1, Math.min(currentPage, calculatedTotalPages))

        // If the requested page was out of range and we have tickets, refetch the valid page
        // Use recursion depth limit to prevent excessive sequential requests for far-out pages
        if (validPage !== currentPage && calculatedTotalPages > 0 && recursionDepth < MAX_RECURSION_DEPTH) {
          return await get().fetchTickets({ ...updatedFilters, page: validPage }, recursionDepth + 1)
        }

        // When recursion limit is hit or page is in range, update state
        // Use validPage (clamped to [1, totalPages]) to maintain pagination invariants (page <= totalPages)
        // This prevents the store from ending up with page > totalPages (e.g., page=999, totalPages=10)
        // Only update lastFilters on successful fetch to prevent failed filter states from being committed
        set({
          tickets: response.results,
          total: response.count,
          page: validPage,
          totalPages: calculatedTotalPages,
          isLoading: false,
          lastFilters: updatedFilters,
        })
      }
    } catch (error) {
      // Only update error state if this is still the latest request
      // Do NOT update lastFilters here - keep the last known-good filter state
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
      pendingFilters: {}, // Reset pending filters when clearing tickets
    })
  },

  setPage: (page: number) => {
    const state = get()
    // Don't update page state here - let fetchTickets update it on success
    // This prevents page/tickets mismatch if the fetch fails
    // Use pendingFilters (not lastFilters) to prevent race conditions:
    // If a new-filter request is in-flight, pendingFilters contains the latest requested filters,
    // while lastFilters still contains the old committed filters. Using pendingFilters ensures
    // we page with the correct (latest) filters even if the previous request hasn't completed yet.
    get().fetchTickets({ ...state.pendingFilters, page })
  },

  createTicket: async (data: CreateTicketRequest): Promise<Ticket> => {
    // Use separate isCreating/createError state to avoid race conditions with fetchTickets
    // This prevents createTicket from clearing error or setting isLoading to false
    // while a fetchTickets request is still in-flight

    // Increment counter and capture the current request ID
    // This prevents concurrent createTicket calls from causing incorrect UI state
    // (e.g., double-submit, retries) where the first request finishing would set
    // isCreating to false while another request is still in-flight
    createRequestCounter += 1
    const requestId = createRequestCounter

    set({ isCreating: true, createError: null })

    try {
      const ticket = await ticketService.createTicket(data)

      // Only update state if this is still the latest request
      // This prevents earlier requests from overwriting state after a newer request completes
      if (requestId === createRequestCounter) {
        set({ isCreating: false })
      }

      return ticket
    } catch (error) {
      // Use parseApiError to extract user-friendly error message from API response
      const errorMessage = parseApiError(error, {
        defaultMessage: 'Failed to create ticket',
      })

      // Only update error state if this is still the latest request
      if (requestId === createRequestCounter) {
        set({
          createError: errorMessage,
          isCreating: false,
        })
      }

      // Re-throw the original error to preserve stack trace and debugging info
      // The store's createError state contains the normalized user-friendly message
      throw error
    }
  },
}))

