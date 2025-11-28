import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  NotificationAPI,
  PaginatedNotificationsAPI,
  Notification,
  NotificationListResponse,
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
}
