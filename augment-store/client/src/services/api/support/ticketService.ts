import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Ticket,
  TicketListResponse,
  CreateTicketRequest,
  UpdateTicketRequest,
  Comment,
  CommentListResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
  TicketFilterParams,
  AdminTicketFilterParams,
  TicketStatsResponse,
} from '@features/support/types'

export const ticketService = {
  /**
   * Get all tickets with optional filtering
   */
  getTickets: async (params?: TicketFilterParams): Promise<TicketListResponse> => {
    const queryParams: Record<string, string | number> = {}

    if (params?.page !== undefined && params?.page !== null) {
      queryParams.page = params.page
    }
    if (params?.status) {
      queryParams.status = params.status
    }
    if (params?.priority) {
      queryParams.priority = params.priority
    }
    if (params?.search) {
      queryParams.search = params.search
    }

    return apiClient.get<TicketListResponse>(API_ENDPOINTS.SUPPORT.TICKETS.LIST, {
      params: queryParams,
    })
  },

  /**
   * Get all admin tickets with optional filtering
   *
   * NOTE: The backend AdminTicketsView only supports filtering by user_id.
   * It does NOT implement status, priority, or search filtering.
   * Those filters are only available on the regular getTickets endpoint.
   */
  getAdminTickets: async (params?: AdminTicketFilterParams): Promise<TicketListResponse> => {
    const queryParams: Record<string, string | number> = {}

    if (params?.page !== undefined && params?.page !== null) {
      queryParams.page = params.page
    }
    if (params?.user_id) {
      queryParams.user_id = params.user_id
    }

    return apiClient.get<TicketListResponse>(API_ENDPOINTS.SUPPORT.TICKETS.ADMIN, {
      params: queryParams,
    })
  },

  /**
   * Get a single ticket by ID
   */
  getTicketById: async (id: string): Promise<Ticket> => {
    return apiClient.get<Ticket>(API_ENDPOINTS.SUPPORT.TICKETS.DETAIL(id))
  },

  /**
   * Create a new support ticket
   */
  createTicket: async (data: CreateTicketRequest): Promise<Ticket> => {
    return apiClient.post<Ticket>(API_ENDPOINTS.SUPPORT.TICKETS.CREATE, data)
  },

  /**
   * Update an existing ticket
   */
  updateTicket: async (id: string, data: UpdateTicketRequest): Promise<Ticket> => {
    return apiClient.patch<Ticket>(API_ENDPOINTS.SUPPORT.TICKETS.UPDATE(id), data)
  },

  /**
   * Delete a ticket (soft delete)
   */
  deleteTicket: async (id: string): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.SUPPORT.TICKETS.DELETE(id))
  },

  /**
   * Get all comments for a ticket
   */
  getComments: async (ticketId: string): Promise<CommentListResponse> => {
    return apiClient.get<CommentListResponse>(API_ENDPOINTS.SUPPORT.COMMENTS.LIST(ticketId))
  },

  /**
   * Create a new comment on a ticket
   */
  createComment: async (
    ticketId: string,
    data: Pick<CreateCommentRequest, 'content'>
  ): Promise<Comment> => {
    // Backend CommentCreateSerializer expects ticket field in payload
    return apiClient.post<Comment>(API_ENDPOINTS.SUPPORT.COMMENTS.CREATE(ticketId), {
      content: data.content,
      ticket: ticketId,
    })
  },

  /**
   * Update an existing comment
   */
  updateComment: async (
    ticketId: string,
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<Comment> => {
    return apiClient.patch<Comment>(
      API_ENDPOINTS.SUPPORT.COMMENTS.UPDATE(ticketId, commentId),
      data
    )
  },

  /**
   * Delete a comment (soft delete)
   */
  deleteComment: async (ticketId: string, commentId: string): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.SUPPORT.COMMENTS.DELETE(ticketId, commentId))
  },

  /**
   * Get ticket statistics
   */
  getTicketStats: async (): Promise<TicketStatsResponse> => {
    return apiClient.get<TicketStatsResponse>(API_ENDPOINTS.SUPPORT.TICKETS.STATS)
  },

  /**
   * Get admin ticket statistics
   */
  getAdminTicketStats: async (): Promise<TicketStatsResponse> => {
    return apiClient.get<TicketStatsResponse>(API_ENDPOINTS.SUPPORT.TICKETS.ADMIN_STATS)
  },
}
