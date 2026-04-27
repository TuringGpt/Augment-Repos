import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  NotificationAPI,
  PaginatedNotificationsAPI,
  Notification,
  NotificationListResponse,
  MarkAsReadRequest,
  MarkAsReadResponse,
  MarkAllAsReadRequest,
  MarkAllAsReadResponse,
  UnreadCountResponse,
} from '@features/notifications/types'

/**
 * Transform notification from API format to frontend format
 */
const transformNotificationFromAPI = (notificationAPI: NotificationAPI): Notification => ({
  id: notificationAPI.id,
  title: notificationAPI.title,
  description: notificationAPI.description,
  isRead: notificationAPI.is_read,
  model: notificationAPI.model,
  objectId: notificationAPI.object_id,
  createdAt: notificationAPI.created_at,
  updatedAt: notificationAPI.updated_at,
})

export const notificationService = {
  /**
   * Get notifications from backend API
   * Backend returns paginated response with count, next, previous, results
   */
  getNotifications: async (page = 1, limit = 10): Promise<NotificationListResponse> => {
    try {
      const response = await apiClient.get<PaginatedNotificationsAPI>(
        API_ENDPOINTS.NOTIFICATIONS.LIST,
        {
          params: { page, limit },
        }
      )

      // Transform backend notifications to frontend format
      const notifications: Notification[] = response.results.map(transformNotificationFromAPI)

      // Calculate unread count
      const unreadCount = notifications.filter((n) => !n.isRead).length

      return {
        notifications,
        total: response.count,
        page,
        limit,
        totalPages: Math.ceil(response.count / limit),
        unreadCount,
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      throw error
    }
  },

  /**
   * Mark a notification as read
   * @param notificationId - The ID of the notification to mark as read
   * @returns Minimal response containing only id and is_read fields
   * @note Backend only returns {id, is_read}, not the full notification object
   */
  markAsRead: async (notificationId: string): Promise<MarkAsReadResponse> => {
    try {
      const requestData: MarkAsReadRequest = { is_read: true }
      const response = await apiClient.patch<MarkAsReadResponse>(
        API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(notificationId),
        requestData
      )
      return response
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  },

  /**
   * Mark all notifications as read or mark specific notifications as read
   * @param options - Options for marking notifications as read
   * @param options.markAllAsRead - If true, marks all notifications as read
   * @param options.notificationIds - Array of notification IDs to mark as read
   * @returns Response containing count and array of updated notifications
   * @note Either markAllAsRead or notificationIds must be provided, but not both
   */
  markAllAsRead: async (options: {
    markAllAsRead?: boolean
    notificationIds?: string[]
  }): Promise<MarkAllAsReadResponse> => {
    try {
      // Validate that exactly one option is provided
      const hasMarkAllAsRead = options.markAllAsRead === true
      const hasNotificationIds =
        options.notificationIds !== undefined &&
        options.notificationIds.length > 0

      if (!hasMarkAllAsRead && !hasNotificationIds) {
        throw new Error(
          'Either markAllAsRead must be true or notificationIds array must be provided with at least one ID'
        )
      }

      if (hasMarkAllAsRead && hasNotificationIds) {
        throw new Error(
          'Cannot provide both markAllAsRead and notificationIds - only one option is allowed'
        )
      }

      const requestData: MarkAllAsReadRequest = {
        mark_all_as_read: options.markAllAsRead,
        notification_ids: options.notificationIds,
      }
      const response = await apiClient.patch<MarkAllAsReadResponse>(
        API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ,
        requestData
      )
      return response
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
      throw error
    }
  },

  /**
   * Get unread notification count from backend API
   * @returns The count of unread notifications
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<UnreadCountResponse>(
        API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT
      )
      return response.unread_count
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      throw error
    }
  },
}
