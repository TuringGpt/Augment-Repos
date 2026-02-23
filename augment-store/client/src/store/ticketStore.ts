import { create } from 'zustand'
import { ticketService } from '@services/api'
import type {
  Ticket,
  TicketListItem,
  TicketListResponse,
  CreateTicketRequest,
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
  createTicket: (data: CreateTicketRequest) => Promise<Ticket>
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

// Request counter to prevent race conditions
let fetchTicketsRequestCounter = 0
let fetchTicketRequestCounter = 0
let fetchCommentsRequestCounter = 0
let createCommentRequestCounter = 0
let updateCommentRequestCounter = 0
let deleteCommentRequestCounter = 0

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
      const response = await ticketService.getTickets(mergedParams)

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

      set({
        tickets: response.results,
        totalTickets: response.count,
        totalPages,
        currentPage: mergedParams.page || 1,
        filterParams: mergedParams,
        isFetchingTickets: false,
      })

      return response
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tickets'

      // Only update error state and clear loading flag if this is still the latest request
      if (requestId === fetchTicketsRequestCounter) {
        set({ fetchTicketsError: errorMessage, isFetchingTickets: false })
      }

      throw error
    }
  },

  fetchTicketById: async (id: string) => {
    const requestId = ++fetchTicketRequestCounter

    try {
      set({ isFetchingTicket: true, fetchTicketError: null })

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
      }

      throw error
    }
  },

  createTicket: async (data: CreateTicketRequest) => {
    try {
      set({ isCreatingTicket: true, createTicketError: null })

      const ticket = await ticketService.createTicket(data)

      // Only optimistically update the list if we're on the first page with no filters/search
      // Otherwise, the new ticket should appear on page 1, not the current page
      set((state) => {
        const backendPageSize = 100
        const newTotal = state.totalTickets + 1
        const newTotalPages = Math.ceil(newTotal / backendPageSize)

        // Check if we're on the first page with no filters applied
        const isFirstPage = state.currentPage === 1
        const hasNoFilters = !state.filterParams.status &&
                            !state.filterParams.priority &&
                            !state.filterParams.search

        // Only prepend the ticket if we're on page 1 with no filters
        // Otherwise, just update the counts and let the user refetch
        if (isFirstPage && hasNoFilters) {
          // Convert Ticket to TicketListItem (remove optional fields)
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
          // Just update the counts without modifying the ticket list
          return {
            totalTickets: newTotal,
            totalPages: newTotalPages,
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
      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === id
            ? {
                id: updatedTicket.id,
                title: updatedTicket.title,
                description: updatedTicket.description,
                status: updatedTicket.status,
                priority: updatedTicket.priority,
                assignee: updatedTicket.assignee,
                reporter: updatedTicket.reporter,
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

      // Clamp totalTickets to >= 0 to prevent underflow on double-delete/stale UI
      const newTotal = Math.max(0, state.totalTickets - 1)
      const backendPageSize = 100
      // Clamp totalPages to at least 1 to avoid impossible pagination state
      // when deleting the last ticket (newTotal becomes 0)
      const newTotalPages = Math.max(1, Math.ceil(newTotal / backendPageSize))
      // Ensure currentPage doesn't exceed totalPages after deletion
      const newCurrentPage = Math.min(state.currentPage, newTotalPages)

      set({
        tickets: state.tickets.filter((ticket) => ticket.id !== id),
        totalTickets: newTotal,
        totalPages: newTotalPages,
        currentPage: newCurrentPage,
        // Update filterParams.page to match the clamped currentPage
        // This prevents the UI from pointing at a page that no longer exists
        filterParams: { ...state.filterParams, page: newCurrentPage },
        selectedTicket: state.selectedTicket?.id === id ? null : state.selectedTicket,
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
      } else if (isLatestRequest) {
        // Reset loading flag for stale/canceled requests to prevent stuck loading state
        set({ isFetchingComments: false })
      }

      throw error
    }
  },

  createComment: async (ticketId: string, content: string) => {
    const requestId = ++createCommentRequestCounter

    try {
      set({ isCreatingComment: true, createCommentError: null })

      const comment = await ticketService.createComment(ticketId, { content })

      // Only update state if this is still the latest request AND
      // the ticketId matches the currently selected ticket (guard against stale responses)
      const currentState = get()
      const isLatestRequest = requestId === createCommentRequestCounter
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (!isLatestRequest || !isCurrentTicket) {
        // Reset loading flag for stale/canceled requests to prevent stuck loading state
        if (isLatestRequest) {
          set({ isCreatingComment: false })
        }
        // Don't clear loading flag for stale requests - a newer request is still in-flight
        return comment
      }

      // Add the new comment to the beginning of the list (backend returns comments ordered by -created_at)
      set((state) => ({
        comments: [comment, ...state.comments],
        totalComments: state.totalComments + 1,
        isCreatingComment: false,
      }))

      return comment
    } catch (error) {
      console.error('Failed to create comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create comment'

      // Only update error state if this is still the latest request AND
      // the ticketId matches the currently selected ticket
      const currentState = get()
      const isLatestRequest = requestId === createCommentRequestCounter
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (isLatestRequest && isCurrentTicket) {
        set({ createCommentError: errorMessage, isCreatingComment: false })
      } else if (isLatestRequest) {
        // Reset loading flag for stale requests to prevent stuck loading state
        set({ isCreatingComment: false })
      }

      throw error
    }
  },

  updateComment: async (ticketId: string, commentId: string, data: UpdateCommentRequest) => {
    const requestId = ++updateCommentRequestCounter

    try {
      set({ isUpdatingComment: true, updateCommentError: null })

      const updatedComment = await ticketService.updateComment(ticketId, commentId, data)

      // Only update state if this is still the latest request AND
      // the ticketId matches the currently selected ticket (guard against stale responses)
      const currentState = get()
      const isLatestRequest = requestId === updateCommentRequestCounter
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (!isLatestRequest || !isCurrentTicket) {
        // Reset loading flag for stale/canceled requests to prevent stuck loading state
        if (isLatestRequest) {
          set({ isUpdatingComment: false })
        }
        // Don't clear loading flag for stale requests - a newer request is still in-flight
        return updatedComment
      }

      // Update the comment in the list
      set((state) => ({
        comments: state.comments.map((comment) =>
          comment.id === commentId ? updatedComment : comment
        ),
        isUpdatingComment: false,
      }))

      return updatedComment
    } catch (error) {
      console.error('Failed to update comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update comment'

      // Only update error state if this is still the latest request AND
      // the ticketId matches the currently selected ticket
      const currentState = get()
      const isLatestRequest = requestId === updateCommentRequestCounter
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (isLatestRequest && isCurrentTicket) {
        set({ updateCommentError: errorMessage, isUpdatingComment: false })
      } else if (isLatestRequest) {
        // Reset loading flag for stale requests to prevent stuck loading state
        set({ isUpdatingComment: false })
      }

      throw error
    }
  },

  deleteComment: async (ticketId: string, commentId: string) => {
    const requestId = ++deleteCommentRequestCounter

    try {
      set({ isDeletingComment: true, deleteCommentError: null })

      await ticketService.deleteComment(ticketId, commentId)

      // Only update state if this is still the latest request AND
      // the ticketId matches the currently selected ticket (guard against stale responses)
      const currentState = get()
      const isLatestRequest = requestId === deleteCommentRequestCounter
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (!isLatestRequest || !isCurrentTicket) {
        // Reset loading flag for stale/canceled requests to prevent stuck loading state
        if (isLatestRequest) {
          set({ isDeletingComment: false })
        }
        // Don't clear loading flag for stale requests - a newer request is still in-flight
        return
      }

      // Remove the comment from the list
      set((state) => ({
        comments: state.comments.filter((comment) => comment.id !== commentId),
        totalComments: Math.max(0, state.totalComments - 1),
        isDeletingComment: false,
      }))
    } catch (error) {
      console.error('Failed to delete comment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment'

      // Only update error state if this is still the latest request AND
      // the ticketId matches the currently selected ticket
      const currentState = get()
      const isLatestRequest = requestId === deleteCommentRequestCounter
      const isCurrentTicket = currentState.selectedTicket?.id === ticketId

      if (isLatestRequest && isCurrentTicket) {
        set({ deleteCommentError: errorMessage, isDeletingComment: false })
      } else if (isLatestRequest) {
        // Reset loading flag for stale requests to prevent stuck loading state
        set({ isDeletingComment: false })
      }

      throw error
    }
  },

  clearComments: () =>
    set({
      comments: [],
      totalComments: 0,
      currentCommentsTicketId: null,
    }),
}))

