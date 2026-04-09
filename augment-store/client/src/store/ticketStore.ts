import { create } from 'zustand'
import { ticketService } from '@services/api'
import { parseApiError, sanitizeErrorForLogging } from '@utils/errorUtils'
import type { TicketListItem, TicketFilterParams, CreateTicketRequest, UpdateTicketRequest, Ticket, TicketStatsResponse, Comment, CommentListResponse } from '@features/support/types'

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

  // Ticket statistics state
  stats: TicketStatsResponse | null
  isFetchingStats: boolean
  statsError: string | null

  // Admin ticket statistics state
  adminStats: TicketStatsResponse | null
  isFetchingAdminStats: boolean
  adminStatsError: string | null

  // Comments state
  comments: Comment[]
  commentsTotal: number
  isFetchingComments: boolean
  fetchCommentsError: string | null
  fetchingCommentsTicketId: string | null // Track which ticket's comments are being fetched
  currentCommentsTicketId: string | null // Track which ticket's comments are currently displayed in the store

  // Separate state for create comment action to avoid race conditions with getComments
  isCreatingComment: boolean
  createCommentError: string | null

  // Separate state for update comment action to avoid race conditions with getComments
  isUpdatingComment: boolean
  updateCommentError: string | null

  // Separate state for delete comment action to avoid race conditions with getComments
  isDeletingComment: boolean
  deleteCommentError: string | null

  // Actions
  fetchTickets: (params?: TicketFilterParams, recursionDepth?: number) => Promise<void>
  clearTickets: () => void
  setPage: (page: number) => void
  createTicket: (data: CreateTicketRequest) => Promise<Ticket>
  clearCreateError: () => void
  updateTicket: (id: string, data: UpdateTicketRequest) => Promise<Ticket>
  deleteTicket: (id: string) => Promise<void>
  getTicketById: (id: string) => Promise<Ticket>
  clearSelectedTicket: () => void
  getTicketStats: () => Promise<TicketStatsResponse | null>
  getAdminTicketStats: () => Promise<TicketStatsResponse | null>
  getComments: (ticketId: string) => Promise<CommentListResponse | null>
  clearComments: () => void
  createComment: (ticketId: string, content: string) => Promise<Comment>
  updateComment: (ticketId: string, commentId: string, content: string) => Promise<Comment>
  deleteComment: (ticketId: string, commentId: string) => Promise<void>
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

// In-flight counter to track concurrent delete ticket requests
// Ensures isDeleting reflects "any delete in progress" rather than just the latest request
// This prevents isDeleting from becoming false while earlier requests are still in-flight
let deleteInFlightCount = 0

// Request counter to prevent race conditions in getTicketStats
// When multiple getTicketStats calls are made in quick succession,
// only the most recent request should update the stats state
let fetchStatsRequestCounter = 0

// Request counter to prevent race conditions in getAdminTicketStats
// When multiple getAdminTicketStats calls are made in quick succession,
// only the most recent request should update the adminStats state
let fetchAdminStatsRequestCounter = 0

// Request counter to prevent race conditions in getComments
// When multiple getComments calls are made in quick succession,
// only the most recent request should update the comments state
let fetchCommentsRequestCounter = 0

// In-flight counter to track concurrent create comment requests
// Ensures isCreatingComment reflects "any create in progress" rather than just the latest request
// This prevents isCreatingComment from becoming false while earlier requests are still in-flight
let createCommentInFlightCount = 0

// Request counter to prevent race conditions in createComment error state
// When multiple createComment calls are made in quick succession,
// only the most recent request should update the createCommentError state
// This implements "latest submit wins" semantics for error handling
let createCommentRequestCounter = 0

// In-flight counter to track concurrent update comment requests
// Ensures isUpdatingComment reflects "any update in progress" rather than just the latest request
// This prevents isUpdatingComment from becoming false while earlier requests are still in-flight
let updateCommentInFlightCount = 0

// Request counter to prevent race conditions in updateComment error state
// When multiple updateComment calls are made in quick succession,
// only the most recent request should update the updateCommentError state
// This implements "latest submit wins" semantics for error handling
let updateCommentRequestCounter = 0

// In-flight counter to track concurrent delete comment requests
// Ensures isDeletingComment reflects "any delete in progress" rather than just the latest request
// This prevents isDeletingComment from becoming false while earlier requests are still in-flight
let deleteCommentInFlightCount = 0

// Request counter to prevent race conditions in deleteComment error state
// When multiple deleteComment calls are made in quick succession,
// only the most recent request should update the deleteCommentError state
// This implements "latest submit wins" semantics for error handling
let deleteCommentRequestCounter = 0

// Track locally-updated comment IDs to prevent stale fetched data from overwriting newer local updates
// When updateComment completes, the comment ID is added to this set
// When getComments merges data, it prefers locally-updated comments over fetched ones
// This prevents race conditions where a getComments request started before updateComment
// completes after updateComment and overwrites the newer local content
const locallyUpdatedCommentIds = new Set<string>()

// Track locally-deleted comment IDs to prevent stale fetched data from reintroducing deleted comments
// When deleteComment completes, the comment ID is added to this set
// When getComments merges data, it filters out comments that are in this set
// This prevents race conditions where a getComments request started before deleteComment
// completes after deleteComment and reintroduces the deleted comment back into the store
const locallyDeletedCommentIds = new Set<string>()

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
  stats: null,
  isFetchingStats: false,
  statsError: null,
  adminStats: null,
  isFetchingAdminStats: false,
  adminStatsError: null,
  comments: [],
  commentsTotal: 0,
  isFetchingComments: false,
  fetchCommentsError: null,
  fetchingCommentsTicketId: null,
  currentCommentsTicketId: null,
  isCreatingComment: false,
  createCommentError: null,
  isUpdatingComment: false,
  updateCommentError: null,
  isDeletingComment: false,
  deleteCommentError: null,

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

      // Only set isCreating to false when all requests have completed
      // Check if count is 1 (this is the last request) since decrement happens in finally
      if (createInFlightCount === 1) {
        set({ isCreating: false })
      }

      return ticket
    } catch (error) {
      // Use parseApiError to extract user-friendly error message from API response
      // Pass field names to extract field-specific DRF validation errors (e.g., { title: [...] })
      // Use error code instead of hard-coded English message to allow proper i18n in components
      const errorMessage = parseApiError(error, {
        fieldNames: ['title', 'description', 'priority', 'status', 'assignee'],
        defaultMessage: 'TICKET_CREATE_ERROR',
      })

      // Only update error state and isCreating when all requests have completed
      // Check if count is 1 (this is the last request) since decrement happens in finally
      if (createInFlightCount === 1) {
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

  clearCreateError: () => {
    // Clear the createError state to prevent stale error messages from appearing
    // when reopening the create ticket drawer after a previous failed attempt
    set({ createError: null })
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

    // Increment in-flight counter and set delete-specific loading state
    // After incrementing fetchRequestCounter, we must clear isLoading to prevent the store
    // from being stuck in a loading state if an in-flight fetchTickets() is invalidated
    deleteInFlightCount += 1
    set({
      isDeleting: true,
      deleteError: null,
      isLoading: false,
      // Clear ticket-detail fetch state if deleting the currently fetched/selected ticket
      ...(isDeletingSameTicket && {
        isFetchingTicket: false,
        selectedTicket: null,
        fetchingTicketId: null,
        fetchTicketError: null,
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
      // Capture the old page before updating state to detect page changes
      const oldPage = get().page

      set((state) => {
        // Always decrement total when a ticket is successfully deleted
        // Even if the ticket is not in the current page (e.g., deleted from detail view),
        // it still contributes to the total count and should be decremented
        const newTotal = Math.max(0, state.total - 1)

        // Recalculate total pages based on new total
        // Derive page size from current state to match fetchTickets() logic and handle
        // backend page size changes or differences across environments
        let newTotalPages: number
        if (newTotal === 0) {
          // Edge case: empty results should show 1 page (not 0) for pagination UI compatibility
          newTotalPages = 1
        } else if (state.total > 0 && state.totalPages > 0) {
          // Derive page size from the last successful fetch response
          // This ensures consistency with fetchTickets() which derives page size from API responses
          const derivedPageSize = Math.ceil(state.total / state.totalPages)
          newTotalPages = Math.ceil(newTotal / derivedPageSize)
        } else {
          // Fallback: use BACKEND_PAGE_SIZE if we don't have valid state
          // This should rarely happen, but provides a safe default
          newTotalPages = Math.ceil(newTotal / BACKEND_PAGE_SIZE)
        }

        // Clamp current page to valid range [1, newTotalPages] to prevent invalid pagination state
        // This prevents issues when deleting the last item on the last page
        const newPage = newTotalPages > 0 ? Math.max(1, Math.min(state.page, newTotalPages)) : 1

        return {
          tickets: state.tickets.filter((ticket) => ticket.id !== id),
          total: newTotal,
          page: newPage,
          totalPages: newTotalPages,
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

      // If the page changed (e.g., deleted last item on last page), refetch the new page
      // This ensures the UI shows the correct tickets for the new page instead of stale data
      // Note: This refetch happens BEFORE decrementing the counter (which happens in finally),
      // so isDeleting remains true during the refetch. This is intentional to keep UI controls
      // disabled until the entire delete operation (including any necessary refetch) completes.
      // The refetch is OUTSIDE the try-catch because the ticket was already successfully deleted.
      // If this refetch fails, it's a fetch error, not a delete error, and should not mislead
      // callers/UI about the deletion.
      const newPage = get().page
      if (newPage !== oldPage) {
        try {
          await get().fetchTickets({ page: newPage })
        } catch (fetchError) {
          // Log the fetch error but don't treat it as a delete failure
          // The ticket was already successfully deleted
          // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
          console.error('Failed to refetch tickets after deletion:', sanitizeErrorForLogging(fetchError, 'Failed to refetch tickets after deletion'))
          // The fetch error will be handled by fetchTickets() and set in the store's error state
        }
      }
    } catch (error) {
      // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
      console.error('Failed to delete ticket:', sanitizeErrorForLogging(error, 'Failed to delete ticket'))
      // Use parseApiError to extract user-friendly error message from API response
      // This ensures consistency with createTicket/updateTicket and properly handles DRF errors
      const errorMessage = parseApiError(error, {
        defaultMessage: 'Failed to delete ticket',
      })

      set({
        deleteError: errorMessage,
      })
      throw error
    } finally {
      // Decrement in-flight counter in finally block to guarantee cleanup on all paths
      // This ensures isDeleting is set to false even if parseApiError() or other error handling throws
      deleteInFlightCount -= 1
      set({
        // Set isDeleting based on in-flight counter (already decremented above)
        // For single delete: counter goes 1→0, so isDeleting becomes false (0 > 0 = false)
        // This guarantees UI controls are re-enabled after deletion completes (success or failure)
        isDeleting: deleteInFlightCount > 0
      })
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
      // Only update error state if this is still the most recent request
      if (currentRequestId === fetchTicketRequestCounter) {
        // Set error code instead of hard-coded message to allow proper localization
        // The error code will be translated by the component using translateErrorCode()
        set({ fetchTicketError: 'TICKET_LOAD_ERROR' })

        // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
        console.error('Failed to fetch ticket:', sanitizeErrorForLogging(error, 'Failed to fetch ticket'))
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

  getTicketStats: async (): Promise<TicketStatsResponse | null> => {
    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    fetchStatsRequestCounter += 1
    const currentRequestId = fetchStatsRequestCounter

    // Set loading state and clear any previous error BEFORE any awaited work
    set({ isFetchingStats: true, statsError: null })

    try {
      const stats = await ticketService.getTicketStats()

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === fetchStatsRequestCounter) {
        set({ stats, isFetchingStats: false })
        return stats
      }

      // Return null if request was superseded to prevent callers from acting on stale results
      return null
    } catch (error) {
      // Only update error state if this is still the most recent request
      if (currentRequestId === fetchStatsRequestCounter) {
        const errorMessage = parseApiError(error, {
          defaultMessage: 'Failed to fetch ticket statistics',
        })
        set({
          statsError: errorMessage,
          isFetchingStats: false,
        })

        // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
        console.error('Failed to fetch ticket stats:', sanitizeErrorForLogging(error, 'Failed to fetch ticket statistics'))
        throw error
      }

      // Return null if request was superseded to prevent callers from handling stale errors
      return null
    }
  },

  getAdminTicketStats: async (): Promise<TicketStatsResponse | null> => {
    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    fetchAdminStatsRequestCounter += 1
    const currentRequestId = fetchAdminStatsRequestCounter

    // Set loading state and clear any previous error BEFORE any awaited work
    set({ isFetchingAdminStats: true, adminStatsError: null })

    try {
      const adminStats = await ticketService.getAdminTicketStats()

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === fetchAdminStatsRequestCounter) {
        set({ adminStats, isFetchingAdminStats: false })
        return adminStats
      }

      // Return null if request was superseded to prevent callers from acting on stale results
      return null
    } catch (error) {
      // Only update error state if this is still the most recent request
      if (currentRequestId === fetchAdminStatsRequestCounter) {
        const errorMessage = parseApiError(error, {
          defaultMessage: 'Failed to fetch admin ticket statistics',
        })
        set({
          adminStatsError: errorMessage,
          isFetchingAdminStats: false,
        })

        // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
        console.error('Failed to fetch admin ticket stats:', sanitizeErrorForLogging(error, 'Failed to fetch admin ticket statistics'))
        throw error
      }

      // Return null if request was superseded to prevent callers from handling stale errors
      return null
    }
  },

  getComments: async (ticketId: string): Promise<CommentListResponse | null> => {
    // Increment counter to track this request
    // This prevents race conditions when multiple calls are made rapidly
    fetchCommentsRequestCounter += 1
    const currentRequestId = fetchCommentsRequestCounter

    // Set loading state and clear stale data BEFORE any awaited work
    // Store the ticket ID being fetched so we can track which ticket's comments are being loaded
    // Update currentCommentsTicketId immediately to prevent in-flight createComment from previous ticket
    // from appending to the just-cleared comments array during navigation
    set({ isFetchingComments: true, fetchCommentsError: null, comments: [], commentsTotal: 0, fetchingCommentsTicketId: ticketId, currentCommentsTicketId: ticketId })

    try {
      const response = await ticketService.getComments(ticketId)

      // Only update state if this is still the most recent request
      // If a newer request has been made, discard this response
      if (currentRequestId === fetchCommentsRequestCounter) {
        // Merge locally-created/updated/deleted comments with fetched comments to prevent race conditions
        // where an in-flight getComments started before createComment/updateComment/deleteComment can overwrite optimistically-added/updated/deleted comments
        // Use functional set form to access current state at the time of resolution
        set((state) => {
          // Build a Set of comment IDs from the API response for efficient lookup
          const fetchedCommentIds = new Set(response.results.map(c => c.id))

          // Find locally-created comments that aren't in the API response yet
          // These are comments that were optimistically added by createComment but haven't been returned by the API
          const localOnlyComments = state.comments.filter(c => !fetchedCommentIds.has(c.id))

          // Build a Map of locally-updated comments by ID for efficient lookup
          // These are comments that were updated by updateComment and should be preferred over fetched versions
          const locallyUpdatedCommentsMap = new Map(
            state.comments
              .filter(c => locallyUpdatedCommentIds.has(c.id))
              .map(c => [c.id, c])
          )

          // Merge fetched comments, preferring locally-updated versions when they exist
          // This prevents stale fetched data from overwriting newer local updates
          // Also filter out locally-deleted comments to prevent stale fetched data from reintroducing them
          // This prevents race conditions where a getComments request started before deleteComment
          // completes after deleteComment and reintroduces the deleted comment
          const mergedFetchedComments = response.results
            .filter(fetchedComment => !locallyDeletedCommentIds.has(fetchedComment.id))
            .map(fetchedComment =>
              locallyUpdatedCommentsMap.get(fetchedComment.id) ?? fetchedComment
            )

          // Merge: prepend local-only comments to maintain newest-first ordering
          // Local comments are newer than fetched comments since they were just created
          const mergedComments = [...localOnlyComments, ...mergedFetchedComments]

          return {
            comments: mergedComments,
            commentsTotal: mergedComments.length,
            isFetchingComments: false,
            fetchingCommentsTicketId: null,
            currentCommentsTicketId: ticketId
          }
        })
        return response
      }

      // Return null if request was superseded to prevent callers from acting on stale results
      return null
    } catch (error) {
      // Only update error state if this is still the most recent request
      if (currentRequestId === fetchCommentsRequestCounter) {
        const errorMessage = parseApiError(error, {
          defaultMessage: 'Failed to fetch comments',
        })
        set({
          fetchCommentsError: errorMessage,
          isFetchingComments: false,
          fetchingCommentsTicketId: null
        })

        // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
        console.error('Failed to fetch comments:', sanitizeErrorForLogging(error, 'Failed to fetch comments'))
        throw error
      }

      // Return null for superseded requests to prevent callers from handling stale errors
      return null
    }
  },

  clearComments: () => {
    // Increment counter to invalidate any in-flight fetch requests
    // This prevents in-flight responses from repopulating the store after clear
    fetchCommentsRequestCounter += 1

    // Increment createCommentRequestCounter to invalidate in-flight createComment requests
    // This prevents stale createComment failures from a previous ticket from setting
    // createCommentError after switching to a new ticket
    createCommentRequestCounter += 1

    // Increment updateCommentRequestCounter to invalidate in-flight updateComment requests
    // This prevents stale updateComment failures from a previous ticket from setting
    // updateCommentError after switching to a new ticket
    updateCommentRequestCounter += 1

    // Increment deleteCommentRequestCounter to invalidate in-flight deleteComment requests
    // This prevents stale deleteComment failures from a previous ticket from setting
    // deleteCommentError after switching to a new ticket
    deleteCommentRequestCounter += 1

    // Clear the set of locally-updated comment IDs since we're clearing all comments
    // This prevents stale tracking data from affecting future comment fetches
    locallyUpdatedCommentIds.clear()

    // Clear the set of locally-deleted comment IDs since we're clearing all comments
    // This prevents stale tracking data from affecting future comment fetches
    locallyDeletedCommentIds.clear()

    set({
      comments: [],
      commentsTotal: 0,
      isFetchingComments: false,
      fetchCommentsError: null,
      fetchingCommentsTicketId: null,
      currentCommentsTicketId: null,
      // Only clear isCreatingComment if no create requests are in-flight
      // This preserves the invariant: createCommentInFlightCount === 0 ⇔ isCreatingComment === false
      // If we unconditionally set isCreatingComment to false while requests are in-flight,
      // the flag won't be set back to true when those requests complete
      isCreatingComment: createCommentInFlightCount === 0 ? false : get().isCreatingComment,
      createCommentError: null,
      // Only clear isUpdatingComment if no update requests are in-flight
      // This preserves the invariant: updateCommentInFlightCount === 0 ⇔ isUpdatingComment === false
      // If we unconditionally set isUpdatingComment to false while requests are in-flight,
      // the flag won't be set back to true when those requests complete
      isUpdatingComment: updateCommentInFlightCount === 0 ? false : get().isUpdatingComment,
      updateCommentError: null,
      // Only clear isDeletingComment if no delete requests are in-flight
      // This preserves the invariant: deleteCommentInFlightCount === 0 ⇔ isDeletingComment === false
      // If we unconditionally set isDeletingComment to false while requests are in-flight,
      // the flag won't be set back to true when those requests complete
      isDeletingComment: deleteCommentInFlightCount === 0 ? false : get().isDeletingComment,
      deleteCommentError: null,
    })
  },

  createComment: async (ticketId: string, content: string): Promise<Comment> => {
    // Use separate isCreatingComment/createCommentError state to avoid race conditions with getComments
    // This prevents createComment from clearing error or setting isFetchingComments to false
    // while a getComments request is still in-flight

    // Increment request counter to track this specific request
    // This implements "latest submit wins" semantics for error state
    createCommentRequestCounter += 1
    const currentRequestId = createCommentRequestCounter

    try {
      // Increment in-flight count to track concurrent create comment requests
      // This ensures isCreatingComment reflects "any create in progress" rather than just the latest request
      // When the count goes from 0 to 1, set isCreatingComment to true
      // When the count goes back to 0, set isCreatingComment to false
      // Increment is inside try/finally to ensure decrement happens even on early failures
      createCommentInFlightCount += 1
      const isFirstRequest = createCommentInFlightCount === 1

      // Clear error for every new request to implement "latest submit wins" semantics
      // This prevents stale errors from previous requests from remaining visible
      // Only set isCreatingComment to true for the first concurrent request to avoid unnecessary updates
      if (isFirstRequest) {
        set({ isCreatingComment: true, createCommentError: null })
      } else {
        set({ createCommentError: null })
      }

      const comment = await ticketService.createComment(ticketId, { content })

      // Add the new comment to the store's comments array to prevent stale data
      // This ensures components reading from useTicketStore().comments see the new comment immediately
      // without needing an explicit refetch
      // Guard against cross-ticket comment leakage: only mutate if this comment belongs to the current ticket
      // This prevents in-flight requests from a previous ticket from appending to the new ticket's comments
      // Use functional set form to avoid losing concurrent updates when multiple comment mutations resolve close together
      // Prepend the new comment to maintain consistency with API ordering (newest-first)
      // This prevents locally-added comments from appearing in a different position than freshly fetched data
      set((state) => {
        if (state.currentCommentsTicketId === ticketId) {
          return {
            comments: [comment, ...state.comments],
            commentsTotal: state.commentsTotal + 1
          }
        }
        return {}
      })

      return comment
    } catch (error) {
      // Use parseApiError to extract user-friendly error message from API response
      // Pass field names to extract field-specific DRF validation errors (e.g., { content: [...] })
      // Use error code instead of hard-coded English message to allow proper i18n in components
      const errorMessage = parseApiError(error, {
        fieldNames: ['content', 'ticket'],
        defaultMessage: 'COMMENT_CREATE_ERROR',
      })

      // Only update error state if this is still the most recent request
      // This prevents stale/late completions from overwriting the error state
      // Implements "latest submit wins" semantics
      if (currentRequestId === createCommentRequestCounter) {
        set({ createCommentError: errorMessage })
      }

      // Re-throw the original error to preserve stack trace and debugging info
      // The store's createCommentError state contains the normalized user-friendly message
      throw error
    } finally {
      // Decrement in-flight count in finally to ensure it happens even on early failures
      // This prevents race conditions where a synchronous subscriber could start another
      // createComment during set(...) and leave isCreatingComment false while a request is in-flight
      createCommentInFlightCount -= 1

      // Only set isCreatingComment to false when all requests have completed
      // Check if count is 0 (all requests completed) after decrementing
      if (createCommentInFlightCount === 0) {
        set({ isCreatingComment: false })
      }
    }
  },

  updateComment: async (ticketId: string, commentId: string, content: string): Promise<Comment> => {
    // Use separate isUpdatingComment/updateCommentError state to avoid race conditions with getComments
    // This prevents updateComment from clearing error or setting isFetchingComments to false
    // while a getComments request is still in-flight

    // Increment request counter to track this specific request
    // This implements "latest submit wins" semantics for error state
    updateCommentRequestCounter += 1
    const currentRequestId = updateCommentRequestCounter

    try {
      // Increment in-flight count to track concurrent update comment requests
      // This ensures isUpdatingComment reflects "any update in progress" rather than just the latest request
      // When the count goes from 0 to 1, set isUpdatingComment to true
      // When the count goes back to 0, set isUpdatingComment to false
      // Increment is inside try/finally to ensure decrement happens even on early failures
      updateCommentInFlightCount += 1
      const isFirstRequest = updateCommentInFlightCount === 1

      // Clear error for every new request to implement "latest submit wins" semantics
      // This prevents stale errors from previous requests from remaining visible
      // Only set isUpdatingComment to true for the first concurrent request to avoid unnecessary updates
      if (isFirstRequest) {
        set({ isUpdatingComment: true, updateCommentError: null })
      } else {
        set({ updateCommentError: null })
      }

      const comment = await ticketService.updateComment(ticketId, commentId, { content })

      // Only update state if this is still the most recent request
      // This prevents stale/late completions from overwriting newer content
      // Implements "latest submit wins" semantics
      if (currentRequestId === updateCommentRequestCounter) {
        // Track this comment as locally-updated to prevent stale fetched data from overwriting it
        // This ensures that if a getComments request started before this update completes after it,
        // the merge logic will prefer this locally-updated version over the stale fetched version
        locallyUpdatedCommentIds.add(commentId)

        // Update the comment in the store's comments array to prevent stale data
        // This ensures components reading from useTicketStore().comments see the updated content immediately
        // without needing an explicit refetch
        // Guard against cross-ticket comment leakage: only mutate if this comment belongs to the current ticket
        // This prevents in-flight requests from a previous ticket from updating the new ticket's comments
        // Use functional set form to avoid losing concurrent updates when multiple comment mutations resolve close together
        set((state) => {
          if (state.currentCommentsTicketId === ticketId) {
            const updatedComments = state.comments.map(c =>
              c.id === commentId ? comment : c
            )
            return { comments: updatedComments }
          }
          return {}
        })
      }

      return comment
    } catch (error) {
      // Use parseApiError to extract user-friendly error message from API response
      // Pass field names to extract field-specific DRF validation errors (e.g., { content: [...] })
      // Use error code instead of hard-coded English message to allow proper i18n in components
      const errorMessage = parseApiError(error, {
        fieldNames: ['content'],
        defaultMessage: 'COMMENT_UPDATE_ERROR',
      })

      // Only update error state if this is still the most recent request
      // This prevents stale/late completions from overwriting the error state
      // Implements "latest submit wins" semantics
      if (currentRequestId === updateCommentRequestCounter) {
        set({ updateCommentError: errorMessage })
      }

      // Re-throw the original error to preserve stack trace and debugging info
      // The store's updateCommentError state contains the normalized user-friendly message
      throw error
    } finally {
      // Decrement in-flight count in finally to ensure it happens even on early failures
      // This prevents race conditions where a synchronous subscriber could start another
      // updateComment during set(...) and leave isUpdatingComment false while a request is in-flight
      updateCommentInFlightCount -= 1

      // Only set isUpdatingComment to false when all requests have completed
      // Check if count is 0 (all requests completed) after decrementing
      if (updateCommentInFlightCount === 0) {
        set({ isUpdatingComment: false })
      }
    }
  },

  deleteComment: async (ticketId: string, commentId: string): Promise<void> => {
    // Use separate isDeletingComment/deleteCommentError state to avoid race conditions with getComments
    // This prevents deleteComment from clearing error or setting isFetchingComments to false
    // while a getComments request is still in-flight

    // Increment request counter to track this specific request
    // This implements "latest submit wins" semantics for error state
    deleteCommentRequestCounter += 1
    const currentRequestId = deleteCommentRequestCounter

    try {
      // Increment in-flight count to track concurrent delete comment requests
      // This ensures isDeletingComment reflects "any delete in progress" rather than just the latest request
      // When the count goes from 0 to 1, set isDeletingComment to true
      // When the count goes back to 0, set isDeletingComment to false
      // Increment is inside try/finally to ensure decrement happens even on early failures
      deleteCommentInFlightCount += 1
      const isFirstRequest = deleteCommentInFlightCount === 1

      // Clear error for every new request to implement "latest submit wins" semantics
      // This prevents stale errors from previous requests from remaining visible
      // Only set isDeletingComment to true for the first concurrent request to avoid unnecessary updates
      if (isFirstRequest) {
        set({ isDeletingComment: true, deleteCommentError: null })
      } else {
        set({ deleteCommentError: null })
      }

      await ticketService.deleteComment(ticketId, commentId)

      // Track this comment as locally-deleted to prevent stale fetched data from reintroducing it
      // This ensures that if a getComments request started before this delete completes after it,
      // the merge logic will filter out this deleted comment from the stale fetched data
      locallyDeletedCommentIds.add(commentId)

      // Remove the comment from the store's comments array to prevent stale data
      // This ensures components reading from useTicketStore().comments see the deletion immediately
      // without needing an explicit refetch
      // Guard against cross-ticket comment leakage: only mutate if this comment belongs to the current ticket
      // This prevents in-flight requests from a previous ticket from removing comments from the new ticket's list
      // Use functional set form to avoid losing concurrent updates when multiple comment mutations resolve close together
      set((state) => {
        if (state.currentCommentsTicketId === ticketId) {
          const filteredComments = state.comments.filter(c => c.id !== commentId)
          // Derive the new total from the filtered array to prevent off-by-one errors
          // This ensures accuracy even if the comment wasn't present in state.comments
          const newTotal = Math.max(0, state.commentsTotal - (state.comments.length - filteredComments.length))
          return {
            comments: filteredComments,
            commentsTotal: newTotal
          }
        }
        return {}
      })

      // Remove the comment from the locally-updated tracking set if it was there
      // This prevents memory leaks from accumulating deleted comment IDs in the wrong set
      locallyUpdatedCommentIds.delete(commentId)
    } catch (error) {
      // Use parseApiError to extract user-friendly error message from API response
      // Use error code instead of hard-coded English message to allow proper i18n in components
      const errorMessage = parseApiError(error, {
        defaultMessage: 'COMMENT_DELETE_ERROR',
      })

      // Only update error state if this is still the most recent request
      // This prevents stale/late completions from overwriting the error state
      // Implements "latest submit wins" semantics
      if (currentRequestId === deleteCommentRequestCounter) {
        set({ deleteCommentError: errorMessage })
      }

      // Re-throw the original error to preserve stack trace and debugging info
      // The store's deleteCommentError state contains the normalized user-friendly message
      throw error
    } finally {
      // Decrement in-flight count in finally to ensure it happens even on early failures
      // This prevents race conditions where a synchronous subscriber could start another
      // deleteComment during set(...) and leave isDeletingComment false while a request is in-flight
      deleteCommentInFlightCount -= 1

      // Only set isDeletingComment to false when all requests have completed
      // Check if count is 0 (all requests completed) after decrementing
      if (deleteCommentInFlightCount === 0) {
        set({ isDeletingComment: false })
      }
    }
  },
}))

// Subscribe to auth state changes and clear admin-only data when user logs out
// This prevents adminStats (and related loading/error state) from surviving logout/login
// within the same SPA session and being accidentally displayed/leaked to a subsequent user

// Track whether the subscription has been successfully established
let authSubscriptionEstablished = false

// Function to set up the auth subscription with retry capability
const setupAuthSubscription = () => {
  import('@store/authStore')
    .then(({ useAuthStore }) => {
      // Mark subscription as established
      authSubscriptionEstablished = true

      let previousAuthState = useAuthStore.getState().isAuthenticated

      const unsubscribe = useAuthStore.subscribe((state) => {
        const currentAuthState = state.isAuthenticated

        // Detect transition from authenticated to unauthenticated
        if (previousAuthState === true && currentAuthState === false) {
          // Log only in development to prevent noisy console output in production
          if (import.meta.env.DEV) {
            console.log('🔒 User logged out - clearing admin ticket data from memory')
          }

          // Increment counter to invalidate any in-flight admin stats requests
          // This prevents in-flight responses from repopulating the store after logout
          fetchAdminStatsRequestCounter += 1

          // Clear admin-only state to prevent data leakage across user sessions
          useTicketStore.setState({
            adminStats: null,
            isFetchingAdminStats: false,
            adminStatsError: null,
          })
        }

        previousAuthState = currentAuthState
      })

      // Clean up subscription on HMR module disposal to prevent memory leaks
      if (import.meta.hot) {
        import.meta.hot.dispose(() => {
          unsubscribe()
        })
      }
    })
    .catch((error) => {
      // Log only sanitized error information to avoid exposing sensitive details (e.g., Authorization headers)
      console.error('Failed to load authStore for ticket store subscription:', sanitizeErrorForLogging(error, 'Failed to load authStore for ticket store subscription'))

      // Clear admin-only state immediately to prevent privacy risk in shared-browser sessions.
      useTicketStore.setState({
        adminStats: null,
        isFetchingAdminStats: false,
        adminStatsError: null,
      })

      // Retry the subscription after a delay to ensure protection is eventually established
      // This prevents a scenario where adminStats is fetched later but never cleared on logout
      // because the subscription failed to initialize
      if (import.meta.env.DEV) {
        console.log('Will retry authStore subscription in 5 seconds to ensure logout protection...')
      }
      setTimeout(() => {
        if (!authSubscriptionEstablished) {
          setupAuthSubscription()
        }
      }, 5000)
    })
}

// Initialize the subscription
setupAuthSubscription()

