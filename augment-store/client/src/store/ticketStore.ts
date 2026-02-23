import { create } from 'zustand'
import { ticketService } from '@services/api'
import type {
  Ticket,
  TicketListItem,
  TicketListResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  UpdateTicketRequest,
  Comment,
  CommentListResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  TicketFilterParams,
} from '@features/support/types'

interface TicketState {
  // Tickets list state
  tickets: TicketListItem[]
  totalTickets: number
  currentPage: number
  totalPages: number
  
  // Single ticket detail
  selectedTicket: Ticket | null
  
  // Comments for selected ticket
  comments: Comment[]
  totalComments: number
  currentCommentsTicketId: string | null // Track which ticket the current comments belong to
  
  // Filter params
  filterParams: TicketFilterParams
  
  // Loading states
  isFetchingTickets: boolean
  isFetchingTicket: boolean
  isCreatingTicket: boolean
  isUpdatingTicket: boolean
  isDeletingTicket: boolean
  isFetchingComments: boolean
  isCreatingComment: boolean
  isUpdatingComment: boolean
  isDeletingComment: boolean
  
  // Error states
  fetchTicketsError: string | null
  fetchTicketError: string | null
  createTicketError: string | null
  updateTicketError: string | null
  deleteTicketError: string | null
  fetchCommentsError: string | null
  createCommentError: string | null
  updateCommentError: string | null
  deleteCommentError: string | null
  
  // Actions - Tickets
  fetchTickets: (params?: TicketFilterParams) => Promise<TicketListResponse>
  fetchTicketById: (id: string) => Promise<Ticket>
  createTicket: (data: CreateTicketRequest) => Promise<CreateTicketResponse>
  updateTicket: (id: string, data: UpdateTicketRequest) => Promise<Ticket>
  deleteTicket: (id: string) => Promise<void>
  setFilterParams: (params: Partial<TicketFilterParams>) => void
  clearSelectedTicket: () => void
  clearTickets: () => void
  setPage: (page: number) => void
  
  // Actions - Comments
  fetchComments: (ticketId: string) => Promise<CommentListResponse>
  createComment: (ticketId: string, content: string) => Promise<Comment>
  updateComment: (ticketId: string, commentId: string, data: UpdateCommentRequest) => Promise<Comment>
  deleteComment: (ticketId: string, commentId: string) => Promise<void>
  clearComments: () => void
}

// Request counter to prevent race conditions for fetch operations
// For fetch operations, only the latest request should update state (latest wins)
let fetchTicketsRequestCounter = 0
let fetchTicketRequestCounter = 0
let fetchCommentsRequestCounter = 0

// In-flight operation counters for mutation operations
// For mutations, we need to track how many operations are in-flight to prevent
// overlapping requests from prematurely clearing the loading state
let createCommentInFlightCount = 0
let updateCommentInFlightCount = 0
let deleteCommentInFlightCount = 0

// For mutation operations (create/update/delete), we don't use global counters
// because each operation is independent and should succeed.
// We only check if the operation is for the currently selected ticket.

export const useTicketStore = create<TicketState>((set, get) => ({
  // Initial state
  tickets: [],
  totalTickets: 0,
  currentPage: 1,
  totalPages: 1,
  selectedTicket: null,
  comments: [],
  totalComments: 0,
  currentCommentsTicketId: null,
  filterParams: {
    page: 1,
  },
  
  // Loading states
  isFetchingTickets: false,
  isFetchingTicket: false,
  isCreatingTicket: false,
  isUpdatingTicket: false,
  isDeletingTicket: false,
  isFetchingComments: false,
  isCreatingComment: false,
  isUpdatingComment: false,
  isDeletingComment: false,
  
  // Error states
  fetchTicketsError: null,
  fetchTicketError: null,
  createTicketError: null,
  updateTicketError: null,
  deleteTicketError: null,
  fetchCommentsError: null,
  createCommentError: null,
  updateCommentError: null,
  deleteCommentError: null,
  
  // Actions - Tickets
  fetchTickets: async (params?: TicketFilterParams) => {
    const requestId = ++fetchTicketsRequestCounter

    try {
      set({ isFetchingTickets: true, fetchTicketsError: null })

      const mergedParams = { ...get().filterParams, ...params }
      const requestedPage = mergedParams.page || 1

      // Try to fetch the requested page
      // DRF PageNumberPagination returns 404 for out-of-range pages
      let response
      let actualPage = requestedPage

      try {
        response = await ticketService.getTickets(mergedParams)
      } catch (error) {
        // Check if this is a 404 error (out-of-range page)
        const is404 = (error as { response?: { status?: number } })?.response?.status === 404

        if (is404 && requestedPage > 1) {
          // Page is out of range, fall back to page 1
          // This handles cases where filters reduce results or user navigates past the end
          actualPage = 1
          const fallbackParams = { ...mergedParams, page: 1 }
          response = await ticketService.getTickets(fallbackParams)
        } else {
          // Not a 404 or already on page 1, re-throw the error
          throw error
        }
      }

      // Only update state if this is still the latest request
      if (requestId !== fetchTicketsRequestCounter) {
        // Don't clear loading flag for stale requests - a newer request is still in-flight
        return response
      }

      // Calculate total pages using backend page size (100)
      const backendPageSize = 100
      // Clamp totalPages to at least 1 to avoid impossible pagination state
      // when count is 0 (which would yield 0 pages but currentPage is 1)
      const totalPages = Math.max(1, Math.ceil(response.count / backendPageSize))

      // Clamp currentPage to valid range [1, totalPages]
      const clampedPage = Math.min(Math.max(1, actualPage), totalPages)

      // Update filterParams.page to match the clamped page to keep state consistent
      const normalizedParams = { ...mergedParams, page: clampedPage }

      set({
        tickets: response.results,
        totalTickets: response.count,
        totalPages,
        currentPage: clampedPage,
        filterParams: normalizedParams,
        isFetchingTickets: false,
      })

      return response
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tickets'

      // Only update error state and clear loading flag if this is still the latest request
      if (requestId === fetchTicketsRequestCounter) {
        set({ fetchTicketsError: errorMessage, isFetchingTickets: false })
        // Only throw if this is the latest request - stale requests should be suppressed
        throw error
      }

      // Stale request - suppress the error to avoid spurious error UI from outdated fetches
      // A newer request is in-flight or has already completed
      return { results: [], count: 0, next: null, previous: null }
    }
  },

  fetchTicketById: async (id: string) => {
    const requestId = ++fetchTicketRequestCounter
    // Invalidate any in-flight fetchComments requests to prevent stale comments
    // from a previous ticket being populated after navigation
    fetchCommentsRequestCounter++

    try {
      set({
        isFetchingTicket: true,
        fetchTicketError: null,
        // Clear comments state to prevent showing stale comments from previous ticket
        comments: [],
        totalComments: 0,
        currentCommentsTicketId: null,
        // Reset loading flag to prevent stuck loading state when invalidating in-flight comment fetches
        isFetchingComments: false,
        fetchCommentsError: null,
      })

      const ticket = await ticketService.getTicketById(id)

      // Only update state if this is still the latest request
      if (requestId !== fetchTicketRequestCounter) {
        // Don't clear loading flag for stale requests - a newer request is still in-flight
        return ticket
      }

      set({
        selectedTicket: ticket,
        isFetchingTicket: false,
      })

      return ticket
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch ticket'

      // Only update error state and clear loading flag if this is still the latest request
      if (requestId === fetchTicketRequestCounter) {
        set({ fetchTicketError: errorMessage, isFetchingTicket: false })
        // Only throw if this is the latest request - stale requests should be suppressed
        throw error
      }

      // Stale request - suppress the error to avoid spurious error UI from outdated fetches
      // A newer request is in-flight or has already completed
      // Return a minimal ticket object to satisfy the return type (caller should ignore this)
      return { id, title: '', description: '', status: 'open', priority: 'medium', assignee: null, reporter: '', created_at: '', updated_at: '' } as Ticket
    }
  },

  createTicket: async (data: CreateTicketRequest) => {
    try {
      set({ isCreatingTicket: true, createTicketError: null })

      // Backend returns CreateTicketResponse which includes id and reporter
      // These fields are auto-generated by the backend (id) and set from authenticated user (reporter)
      const ticket = await ticketService.createTicket(data)

      // Only optimistically update the list if we're on the first page with no filters/search
      // Otherwise, the new ticket should appear on page 1, not the current page
      set((state) => {
        const backendPageSize = 100

        // Check if we're on the first page with no filters applied
        const isFirstPage = state.currentPage === 1
        const hasNoFilters = !state.filterParams.status &&
                            !state.filterParams.priority &&
                            !state.filterParams.search

        // Only update counts and list if we have no filters
        // When filters are active, totalTickets/totalPages represent filtered counts
        // and we can't reliably update them without knowing if the new ticket matches the filters
        if (hasNoFilters) {
          const newTotal = state.totalTickets + 1
          const newTotalPages = Math.ceil(newTotal / backendPageSize)

          // Only prepend the ticket if we're on page 1
          if (isFirstPage) {
            // Convert CreateTicketResponse to TicketListItem
            // The response is guaranteed to have id and reporter from the backend
            const ticketListItem: TicketListItem = {
              id: ticket.id,
              title: ticket.title,
              description: ticket.description,
              status: ticket.status,
              priority: ticket.priority,
              assignee: ticket.assignee,
              reporter: ticket.reporter,
            }

            const updatedTickets = [ticketListItem, ...state.tickets].slice(0, backendPageSize)

            return {
              tickets: updatedTickets,
              totalTickets: newTotal,
              totalPages: newTotalPages,
              isCreatingTicket: false,
            }
          } else {
            // Not on page 1, just update the counts
            return {
              totalTickets: newTotal,
              totalPages: newTotalPages,
              isCreatingTicket: false,
            }
          }
        } else {
          // Filters are active - don't update counts or list
          // The user will need to refetch to see the new ticket if it matches their filters
          return {
            isCreatingTicket: false,
          }
        }
      })

      return ticket
    } catch (error) {
      console.error('Failed to create ticket:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create ticket'
      set({ createTicketError: errorMessage, isCreatingTicket: false })
      throw error
    }
  },

  updateTicket: async (id: string, data: UpdateTicketRequest) => {
    try {
      set({ isUpdatingTicket: true, updateTicketError: null })

      const updatedTicket = await ticketService.updateTicket(id, data)

      // Update the ticket in the list
      // Merge with existing ticket to preserve read-only fields (id, reporter)
      // that may be omitted by write serializers
      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                ...updatedTicket,
                // Ensure id and reporter are never overwritten with undefined
                id: updatedTicket.id ?? ticket.id,
                reporter: updatedTicket.reporter ?? ticket.reporter,
              }
            : ticket
        ),
        selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket,
        isUpdatingTicket: false,
      }))

      return updatedTicket
    } catch (error) {
      console.error('Failed to update ticket:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update ticket'
      set({ updateTicketError: errorMessage, isUpdatingTicket: false })
      throw error
    }
  },

  deleteTicket: async (id: string) => {
    try {
      set({ isDeletingTicket: true, deleteTicketError: null })

      await ticketService.deleteTicket(id)

      // Remove the ticket from the list and update pagination
      const state = get()

      // Always decrement totalTickets since the backend deletion succeeded
      // Even if the ticket isn't in the current page, it was deleted from the backend
      const newTotal = Math.max(0, state.totalTickets - 1)
      const backendPageSize = 100
      // Clamp totalPages to at least 1 to avoid impossible pagination state
      // when deleting the last ticket (newTotal becomes 0)
      const newTotalPages = Math.max(1, Math.ceil(newTotal / backendPageSize))
      // Ensure currentPage doesn't exceed totalPages after deletion
      const newCurrentPage = Math.min(state.currentPage, newTotalPages)

      // Check if we're deleting the currently selected ticket
      const isDeletingSelectedTicket = state.selectedTicket?.id === id

      // If deleting the currently selected ticket, invalidate any in-flight comment fetches
      if (isDeletingSelectedTicket) {
        fetchCommentsRequestCounter++
      }

      set({
        tickets: state.tickets.filter((ticket) => ticket.id !== id),
        totalTickets: newTotal,
        totalPages: newTotalPages,
        currentPage: newCurrentPage,
        // Update filterParams.page to match the clamped currentPage
        // This prevents the UI from pointing at a page that no longer exists
        filterParams: { ...state.filterParams, page: newCurrentPage },
        selectedTicket: isDeletingSelectedTicket ? null : state.selectedTicket,
        // Clear comment state when deleting the currently selected ticket
        // to prevent inconsistent "no ticket selected but comments present" state
        comments: isDeletingSelectedTicket ? [] : state.comments,
        totalComments: isDeletingSelectedTicket ? 0 : state.totalComments,
        currentCommentsTicketId: isDeletingSelectedTicket ? null : state.currentCommentsTicketId,
        // Reset loading and error flags to prevent stuck loading state when invalidating in-flight requests
        // Similar to clearSelectedTicket(), this ensures stale responses won't leave the UI in a loading state
        isFetchingComments: isDeletingSelectedTicket ? false : state.isFetchingComments,
        fetchCommentsError: isDeletingSelectedTicket ? null : state.fetchCommentsError,
        isDeletingTicket: false,
      })

      // If the page was clamped (e.g., deleted last item on last page), refetch to get correct data
      // Handle refetch failure separately from delete operation to avoid misleading "delete failed" UI state
      if (newCurrentPage !== state.currentPage && newTotal > 0) {
        try {
          await get().fetchTickets({ page: newCurrentPage })
        } catch (refetchError) {
          // Log the refetch error but don't throw - the delete operation succeeded
          console.error('Failed to refetch tickets after delete:', refetchError)
        }
      }
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete ticket'
      set({ deleteTicketError: errorMessage, isDeletingTicket: false })
      throw error
    }
  },

  setFilterParams: (params: Partial<TicketFilterParams>) => {
    set((state) => ({
      filterParams: { ...state.filterParams, ...params },
    }))
  },

  clearSelectedTicket: () => {
    // Invalidate any in-flight fetchTicketById requests to prevent stale UI state
    fetchTicketRequestCounter++
    // Invalidate any in-flight fetchComments requests to prevent stale UI state
    fetchCommentsRequestCounter++

    set({
      selectedTicket: null,
      comments: [],
      totalComments: 0,
      currentCommentsTicketId: null,
      // Reset loading flags to prevent perpetual loading state if invalidation happens during in-flight fetch
      isFetchingTicket: false,
      isFetchingComments: false,
      // Reset error states to prevent stale error UI after navigating away
      fetchTicketError: null,
      fetchCommentsError: null,
      createCommentError: null,
      updateCommentError: null,
      deleteCommentError: null,
    })
  },

  clearTickets: () => {
    // Invalidate any in-flight fetchTickets requests
    ++fetchTicketsRequestCounter

    set({
      tickets: [],
      totalTickets: 0,
      currentPage: 1,
      totalPages: 1,
      filterParams: {
        page: 1,
      },
      // Reset loading flag to prevent perpetual loading state if invalidation happens during in-flight fetch
      isFetchingTickets: false,
      // Reset error states to prevent stale error UI after clearing tickets
      fetchTicketsError: null,
      createTicketError: null,
      updateTicketError: null,
      deleteTicketError: null,
    })
  },

  setPage: (page: number) => {
    // Don't update currentPage immediately - let fetchTickets update it on success
    // This prevents pagination state from getting out of sync if the fetch fails
    get().fetchTickets({ page }).catch((error) => {
      console.error('Error fetching tickets on page change:', error)
    })
  },

  // Actions - Comments
  fetchComments: async (ticketId: string) => {
    const requestId = ++fetchCommentsRequestCounter

    try {
      set({ isFetchingComments: true, fetchCommentsError: null })

      const response = await ticketService.getComments(ticketId)

      // Only update state if this is still the latest request AND
      // the ticketId matches the currently selected ticket (guard against stale responses)
      const currentState = get()
      const isLatestRequest = requestId === fetchCommentsRequestCounter
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (!isLatestRequest || !isCurrentTicket) {
        // Reset loading flag for stale/canceled requests to prevent stuck loading state
        if (isLatestRequest) {
          set({ isFetchingComments: false })
        }
        return response
      }

      // Check if there are any in-flight comment mutations
      // If so, don't overwrite the comments array to prevent losing optimistic updates
      const hasInFlightMutations =
        createCommentInFlightCount > 0 ||
        updateCommentInFlightCount > 0 ||
        deleteCommentInFlightCount > 0

      if (hasInFlightMutations) {
        // Only update the loading flag, but don't replace the comments array
        // The mutations will update the comments array when they complete
        set({ isFetchingComments: false })
        return response
      }

      set({
        comments: response.results,
        totalComments: response.count,
        currentCommentsTicketId: ticketId,
        isFetchingComments: false,
      })

      return response
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch comments'

      // Only update error state if this is still the latest request AND
      // the ticketId matches the currently selected ticket
      const currentState = get()
      const isLatestRequest = requestId === fetchCommentsRequestCounter
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (isLatestRequest && isCurrentTicket) {
        set({ fetchCommentsError: errorMessage, isFetchingComments: false })
        // Only throw if this is the latest request for the current ticket
        throw error
      } else if (isLatestRequest) {
        // Reset loading flag for stale/canceled requests to prevent stuck loading state
        set({ isFetchingComments: false })
      }

      // Stale request - suppress the error to avoid spurious error UI from outdated fetches
      // A newer request is in-flight or has already completed, or the ticket has changed
      return { results: [], count: 0, next: null, previous: null }
    }
  },

  createComment: async (ticketId: string, content: string) => {
    // Increment in-flight counter and set loading state
    createCommentInFlightCount++
    set({ isCreatingComment: true, createCommentError: null })

    try {
      const comment = await ticketService.createComment(ticketId, { content })

      // Only update state if the ticketId matches the currently selected ticket
      // (guard against stale responses when user switches tickets)
      const currentState = get()
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (!isCurrentTicket) {
        // Decrement counter and update loading state
        createCommentInFlightCount--
        set({ isCreatingComment: createCommentInFlightCount > 0 })
        return comment
      }

      // Add the new comment to the beginning of the list (backend returns comments ordered by -created_at)
      // Decrement counter and update loading state
      createCommentInFlightCount--
      set((state) => ({
        comments: [comment, ...state.comments],
        totalComments: state.totalComments + 1,
        isCreatingComment: createCommentInFlightCount > 0,
      }))

      return comment
    } catch (error) {
      console.error('Failed to create comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create comment'

      // Only update error state if the ticketId matches the currently selected ticket
      const currentState = get()
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      // Decrement counter and update loading state
      createCommentInFlightCount--

      if (isCurrentTicket) {
        set({ createCommentError: errorMessage, isCreatingComment: createCommentInFlightCount > 0 })
      } else {
        // Reset loading flag for operations on non-current tickets
        set({ isCreatingComment: createCommentInFlightCount > 0 })
      }

      throw error
    }
  },

  updateComment: async (ticketId: string, commentId: string, data: UpdateCommentRequest) => {
    // Increment in-flight counter and set loading state
    updateCommentInFlightCount++
    set({ isUpdatingComment: true, updateCommentError: null })

    try {
      const updatedComment = await ticketService.updateComment(ticketId, commentId, data)

      // Only update state if the ticketId matches the currently selected ticket
      // (guard against stale responses when user switches tickets)
      const currentState = get()
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (!isCurrentTicket) {
        // Decrement counter and update loading state
        updateCommentInFlightCount--
        set({ isUpdatingComment: updateCommentInFlightCount > 0 })
        return updatedComment
      }

      // Update the comment in the list
      // Decrement counter and update loading state
      updateCommentInFlightCount--
      set((state) => ({
        comments: state.comments.map((comment) =>
          comment.id === commentId ? updatedComment : comment
        ),
        isUpdatingComment: updateCommentInFlightCount > 0,
      }))

      return updatedComment
    } catch (error) {
      console.error('Failed to update comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update comment'

      // Only update error state if the ticketId matches the currently selected ticket
      const currentState = get()
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      // Decrement counter and update loading state
      updateCommentInFlightCount--

      if (isCurrentTicket) {
        set({ updateCommentError: errorMessage, isUpdatingComment: updateCommentInFlightCount > 0 })
      } else {
        // Reset loading flag for operations on non-current tickets
        set({ isUpdatingComment: updateCommentInFlightCount > 0 })
      }

      throw error
    }
  },

  deleteComment: async (ticketId: string, commentId: string) => {
    // Increment in-flight counter and set loading state
    deleteCommentInFlightCount++
    set({ isDeletingComment: true, deleteCommentError: null })

    try {
      await ticketService.deleteComment(ticketId, commentId)

      // Only update state if the ticketId matches the currently selected ticket
      // (guard against stale responses when user switches tickets)
      const currentState = get()
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (!isCurrentTicket) {
        // Decrement counter and update loading state
        deleteCommentInFlightCount--
        set({ isDeletingComment: deleteCommentInFlightCount > 0 })
        return
      }

      // Remove the comment from the list
      // Decrement counter and update loading state
      deleteCommentInFlightCount--
      set((state) => ({
        comments: state.comments.filter((comment) => comment.id !== commentId),
        totalComments: Math.max(0, state.totalComments - 1),
        isDeletingComment: deleteCommentInFlightCount > 0,
      }))
    } catch (error) {
      console.error('Failed to delete comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment'

      // Only update error state if the ticketId matches the currently selected ticket
      const currentState = get()
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      // Decrement counter and update loading state
      deleteCommentInFlightCount--

      if (isCurrentTicket) {
        set({ deleteCommentError: errorMessage, isDeletingComment: deleteCommentInFlightCount > 0 })
      } else {
        // Reset loading flag for operations on non-current tickets
        set({ isDeletingComment: deleteCommentInFlightCount > 0 })
      }

      throw error
    }
  },

  clearComments: () => {
    // Invalidate any in-flight fetchComments requests to prevent stale UI state
    fetchCommentsRequestCounter++

    set({
      comments: [],
      totalComments: 0,
      currentCommentsTicketId: null,
      // Reset loading flag to prevent perpetual loading state if invalidation happens during in-flight fetch
      isFetchingComments: false,
      // Reset error state to prevent stale error UI
      fetchCommentsError: null,
    })
  },
}))

