/**
 * Notification API Response (from backend)
 */
export interface NotificationAPI {
  id: string
  created_at: string
  updated_at: string
  title: string
  description: string
  is_read: boolean
  model: string | null
  object_id: string | null
  user: string
}

/**
 * Paginated Notification API Response
 */
export interface PaginatedNotificationsAPI {
  count: number
  next: string | null
  previous: string | null
  results: NotificationAPI[]
}

/**
 * Frontend Notification Model
 */
export interface Notification {
  id: string
  title: string
  description: string
  isRead: boolean
  model: string | null
  objectId: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Notification List Response
 */
export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  page: number
  limit: number
  totalPages: number
  unreadCount: number
}

/**
 * Mark Notification as Read Request
 */
export interface MarkAsReadRequest {
  is_read: boolean
}

/**
 * Mark Notification as Read Response
 */
export interface MarkAsReadResponse {
  id: string
  is_read: boolean
}
