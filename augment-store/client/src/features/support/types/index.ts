// Support Ticket Types
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

// Ticket list item (from TicketListSerializer - excludes created_at, updated_at, is_deleted)
export interface TicketListItem {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  assignee: string | null // User ID
  reporter: string // User ID
}

// Full Ticket interface (from TicketDetailSerializer + BaseModel fields)
export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  assignee: string | null // User ID
  reporter: string // User ID
  created_at?: string // Optional - may not be included in serializer
  updated_at?: string // Optional - may not be included in serializer
  is_deleted?: boolean // Optional - may not be included in serializer
}

// Ticket with populated user details (for display)
export interface TicketWithDetails extends Ticket {
  assignee_name?: string
  reporter_name?: string
}

// Create ticket request (matches TicketCreateSerializer)
export interface CreateTicketRequest {
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  assignee: string // Required - backend model has non-null ForeignKey
}

// Update ticket request
export interface UpdateTicketRequest {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  assignee?: string | null
}

// Comment Types
export interface Comment {
  id: string
  ticket: string // Ticket ID
  user: string // User ID
  content: string
  created_at?: string // Optional - may not be included in serializer
  updated_at?: string // Optional - may not be included in serializer
  is_deleted?: boolean // Optional - may not be included in serializer
}

// Comment with user details (for display)
export interface CommentWithDetails extends Comment {
  user_name?: string
  user_email?: string
}

// Create comment request (matches CommentCreateSerializer)
export interface CreateCommentRequest {
  ticket: string // Required by CommentCreateSerializer (even though view overrides it in perform_create)
  content: string
}

// Update comment request
export interface UpdateCommentRequest {
  content: string
}

// Ticket list response (paginated)
export interface TicketListResponse {
  count: number
  next: string | null
  previous: string | null
  results: TicketListItem[] // Uses TicketListItem (no created_at, updated_at, is_deleted)
}

// Comment list response (paginated)
export interface CommentListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Comment[]
}

// Filter and search params
export interface TicketFilterParams {
  status?: TicketStatus
  priority?: TicketPriority
  page?: number
  search?: string
}
