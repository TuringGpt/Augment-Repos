import { create } from 'zustand'
import { ticketService } from '@services/api'
import { parseApiError } from '@utils/errorUtils'
import type { TicketListItem, TicketFilterParams, CreateTicketRequest, UpdateTicketRequest, Ticket } from '@features/support/types'

interface TicketState {
  tickets: TicketListItem[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
  lastFilters: Omit<TicketFilterParams, 'page'> // Store last successfully fetched filters (excluding page)
  pendingFilters: Omit<TicketFilterParams, 'page'> // Store latest requested filters (even if in-flight)
  pendingPage: number // Store latest requested page (even if in-flight or failed)

  // Single ticket detail
  selectedTicket: Ticket | null
  isFetchingTicket: boolean
  fetchTicketError: string | null
  fetchingTicketId: string | null // Track which ticket ID is currently being fetched

  // Separate state for create ticket action to avoid race conditions with fetchTickets
  isCreating: boolean
  createError: string | null

  // Separate state for update ticket action to avoid race conditions with fetchTickets
  isUpdating: boolean
  updateError: string | null

  // Separate state for delete ticket action to avoid race conditions with fetchTickets
  isDeleting: boolean
  deleteError: string | null

  // Actions
  fetchTickets: (params?: TicketFilterParams, recursionDepth?: number) => Promise<void>
  clearTickets: () => void
  setPage: (page: number) => void
  createTicket: (data: CreateTicketRequest) => Promise<Ticket>
  updateTicket: (id: string, data: UpdateTicketRequest) => Promise<Ticket>
  deleteTicket: (id: string) => Promise<void>
  getTicketById: (id: string) => Promise<Ticket>
  clearSelectedTicket: () => void
}

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

// Request counter to prevent race conditions in getTicketById
// When multiple getTicketById calls are made in quick succession,
// only the most recent request should update the selectedTicket state
let fetchTicketRequestCounter = 0

// In-flight counter to track concurrent create ticket requests
// Ensures isCreating reflects "any create in progress" rather than just the latest request
// This prevents isCreating from becoming false while earlier requests are still in-flight
let createInFlightCount = 0

// In-flight counter to track concurrent update ticket requests
// Ensures isUpdating reflects "any update in progress" rather than just the latest request
// This prevents isUpdating from becoming false while earlier requests are still in-flight
let updateInFlightCount = 0

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
  pendingPage: 1, // Initialize with page 1
  selectedTicket: null,
  isFetchingTicket: false,
  fetchTicketError: null,
  fetchingTicketId: null,
  isCreating: false,
  createError: null,
  isUpdating: false,
  updateError: null,
  isDeleting: false,
  deleteError: null,

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

    // Update pendingFilters and pendingPage immediately to prevent race conditions in setPage()
    // This ensures that if setPage() is called while this request is in-flight,
    // it will use the latest requested filters (not stale lastFilters)
    // Also update pendingPage so the Retry button can retry the correct page if this request fails
    set({ isLoading: true, error: null, pendingFilters: updatedFilters, pendingPage: currentPage })

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
      pendingPage: 1, // Reset pending page when clearing tickets
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

    // Increment in-flight count to track concurrent create requests
    // This ensures isCreating reflects "any create in progress" rather than just the latest request
    // When the count goes from 0 to 1, set isCreating to true
    // When the count goes back to 0, set isCreating to false
    createInFlightCount += 1
    const isFirstRequest = createInFlightCount === 1

    // Only set isCreating to true and clear error for the first concurrent request
    // Subsequent concurrent requests don't need to update these flags
    if (isFirstRequest) {
      set({ isCreating: true, createError: null })
    }

    try {
      const ticket = await ticketService.createTicket(data)

      // Only set isCreating to false when all requests have completed (count reaches 0)
      if (createInFlightCount === 0) {
        set({ isCreating: false })
      }

      return ticket
    } catch (error) {
      // Use parseApiError to extract user-friendly error message from API response
      // Pass field names to extract field-specific DRF validation errors (e.g., { title: [...] })
      const errorMessage = parseApiError(error, {
        fieldNames: ['title', 'description', 'priority', 'status', 'assignee'],
        defaultMessage: 'Failed to create ticket',
      })

      // Only update error state and isCreating when all requests have completed
      if (createInFlightCount === 0) {
        set({
          createError: errorMessage,
          isCreating: false,
        })
      }

      // Re-throw the original error to preserve stack trace and debugging info
      // The store's createError state contains the normalized user-friendly message
      throw error
    } finally {
      // Decrement in-flight count in finally block to ensure it always happens
      // even if parseApiError or any other code in try/catch throws
      createInFlightCount -= 1
    }
  },

  updateTicket: async (id: string, data: UpdateTicketRequest): Promise<Ticket> => {
    // Use separate isUpdating/updateError state (distinct from isLoading/error used by fetchTickets)
    // to allow independent tracking of update operations vs. fetch operations

    // Increment in-flight count to track concurrent updateTicket requests
    // This ensures isUpdating reflects "any update in progress" rather than just the latest request
    // When the count goes from 0 to 1, set isUpdating to true
    // When the count goes back to 0, set isUpdating to false
    updateInFlightCount += 1
    const isFirstRequest = updateInFlightCount === 1

    // Only set isUpdating to true and clear error for the first concurrent request
    // Subsequent concurrent requests don't need to update these flags
    if (isFirstRequest) {
      set({ isUpdating: true, updateError: null })
    }

    try {
      const ticket = await ticketService.updateTicket(id, data)

      // Only invalidate in-flight getTicketById requests if we're updating the same ticket
      // that's currently being fetched. This prevents updateTicket(id) from clobbering
      // unrelated ticket-detail fetches (e.g., user navigates to a different ticket while
      // an update is finishing).
      const state = get()
      const isUpdatingSameTicket = state.fetchingTicketId === id

      if (isUpdatingSameTicket) {
        // Increment fetchTicketRequestCounter to invalidate the in-flight getTicketById request
        // This prevents stale ticket data from overwriting the freshly updated ticket
        fetchTicketRequestCounter += 1

        // When we invalidate in-flight getTicketById requests by bumping the counter,
        // those requests won't clear isFetchingTicket in their finally block (since their
        // currentRequestId won't match the new fetchTicketRequestCounter).
        // To prevent the UI from being stuck in a loading state, we manually clear it here.
        // We also set selectedTicket to the updated ticket to ensure the UI shows the fresh data,
        // even if an in-flight getTicketById had set selectedTicket to null before awaiting.
        set({ isFetchingTicket: false, selectedTicket: ticket, fetchingTicketId: null })
      }

      // Only set isUpdating to false when all requests have completed
      // Check if count is 1 (this is the last request) since decrement happens in finally
      if (updateInFlightCount === 1) {
        set({ isUpdating: false })
      }

      return ticket
    } catch (error) {
      // Use parseApiError to extract user-friendly error message from API response
      // Pass field names to extract field-specific DRF validation errors (e.g., { title: [...] })
      const errorMessage = parseApiError(error, {
        fieldNames: ['title', 'description', 'priority', 'status', 'assignee'],
        defaultMessage: 'Failed to update ticket',
      })

      // Only update error state and isUpdating when all requests have completed
      // Check if count is 1 (this is the last request) since decrement happens in finally
      if (updateInFlightCount === 1) {
        set({
          updateError: errorMessage,
          isUpdating: false,
        })
      }

      // Re-throw the original error to preserve stack trace and debugging info
      // The store's updateError state contains the normalized user-friendly message
      throw error
    } finally {
      // Decrement in-flight count in finally block to ensure it always happens
      // even if parseApiError or any other code in try/catch throws
      updateInFlightCount -= 1
    }
  },

  deleteTicket: async (id: string) => {
    // Increment counter to invalidate any in-flight fetchTickets() requests
    // This prevents a late fetch response from overwriting state with a stale list
    // that re-introduces the deleted ticket
    fetchRequestCounter += 1

    // Check if we're deleting the same ticket that's currently being fetched
    // If so, invalidate the in-flight getTicketById request to prevent it from
    // repopulating selectedTicket after deletion
    const state = get()
    const isDeletingSameTicket = state.fetchingTicketId === id

    if (isDeletingSameTicket) {
      // Increment fetchTicketRequestCounter to invalidate the in-flight getTicketById request
      // This prevents stale ticket data from repopulating selectedTicket after deletion
      fetchTicketRequestCounter += 1
    }

    // Explicitly clear isLoading to prevent UI from getting stuck in loading state
    // if a stale fetch already set isLoading: true before being invalidated
    // Also clear ticket-detail fetch state if we're deleting the currently fetched ticket
    set({
      isDeleting: true,
      deleteError: null,
      isLoading: false,
      // Clear ticket-detail fetch state if deleting the currently fetched/selected ticket
      ...(isDeletingSameTicket && {
        isFetchingTicket: false,
        selectedTicket: null,
        fetchingTicketId: null,
      }),
    })

    try {
      // Call the API to delete the ticket
      await ticketService.deleteTicket(id)

      // After successful deletion, invalidate any getTicketById requests for this ticket
      // that may have started during the deletion (after the initial invalidation).
      // This prevents a race where getTicketById(id) called during deletion could
      // set selectedTicket after deletion completes.
      const currentState = get()
      const isStillFetchingSameTicket = currentState.fetchingTicketId === id

      if (isStillFetchingSameTicket) {
        // Increment fetchTicketRequestCounter to invalidate any in-flight getTicketById request
        // This prevents the in-flight request from setting selectedTicket after deletion
        fetchTicketRequestCounter += 1
      }

      // Remove the ticket from the local state and update pagination
      set((state) => {
        // Check if the ticket exists in the current list
        const ticketExists = state.tickets.some((ticket) => ticket.id === id)

        // Calculate new total
        const newTotal = ticketExists ? Math.max(0, state.total - 1) : state.total

        // Recalculate total pages based on new total
        const newTotalPages = newTotal === 0 ? 1 : Math.ceil(newTotal / BACKEND_PAGE_SIZE)

        // Clamp current page to valid range [1, newTotalPages] to prevent invalid pagination state
        // This prevents issues when deleting the last item on the last page
        const newPage = newTotalPages > 0 ? Math.max(1, Math.min(state.page, newTotalPages)) : 1

        return {
          tickets: state.tickets.filter((ticket) => ticket.id !== id),
          total: newTotal,
          page: newPage,
          totalPages: newTotalPages,
          isDeleting: false,
          // If the deleted ticket was selected, clear the selection
          selectedTicket: state.selectedTicket?.id === id ? null : state.selectedTicket,
          // Clear ticket-detail fetch state if we invalidated an in-flight request
          // This prevents the UI from being stuck in a loading state
          ...(isStillFetchingSameTicket && {
            isFetchingTicket: false,
            fetchingTicketId: null,
          }),
        }
      })
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete ticket'
      set({ deleteError: errorMessage, isDeleting: false })
      throw error
    }
  },

  getTicketById: async (id: string) => {
    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    fetchTicketRequestCounter += 1
    const currentRequestId = fetchTicketRequestCounter

    // Set loading state and clear stale data BEFORE any awaited work
    // Store the ticket ID being fetched so updateTicket can check if it should invalidate this request
    set({ isFetchingTicket: true, fetchTicketError: null, selectedTicket: null, fetchingTicketId: id })

    try {
      const ticket = await ticketService.getTicketById(id)

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === fetchTicketRequestCounter) {
        set({ selectedTicket: ticket })
      }

      return ticket
    } catch (error) {
      console.error('Failed to fetch ticket:', error)

      // Only update error state if this is still the most recent request
      if (currentRequestId === fetchTicketRequestCounter) {
        const errorMessage = 'Failed to fetch ticket. Please try again.'
        set({ fetchTicketError: errorMessage })
      }

      throw error
    } finally {
      // Only clear loading state if this is still the most recent request
      if (currentRequestId === fetchTicketRequestCounter) {
        set({ isFetchingTicket: false, fetchingTicketId: null })
      }
    }
  },

  clearSelectedTicket: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchTicketRequestCounter += 1
    set({ selectedTicket: null, fetchTicketError: null, isFetchingTicket: false, fetchingTicketId: null })
  },
}))

