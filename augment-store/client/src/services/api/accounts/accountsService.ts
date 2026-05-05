import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  AdminUsersListResponse,
  AdminUsersListResponseAPI,
  AdminUser,
  AdminUserAPI,
} from '@features/accounts/types'

/**
 * Transform backend API user data (snake_case) to frontend format (camelCase)
 */
const transformAdminUser = (apiUser: AdminUserAPI): AdminUser => {
  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    username: apiUser.username,
    mobile: apiUser.mobile,
    gender: apiUser.gender,
    image: apiUser.image,
    role: apiUser.role,
    isActive: apiUser.is_active,
    dateJoined: apiUser.date_joined,
  }
}

export const accountsService = {
  /**
   * Get list of all users (admin only)
   * @returns Promise with list of users and count
   */
  getAdminUsers: async (): Promise<AdminUsersListResponse> => {
    const response = await apiClient.get<AdminUsersListResponseAPI>(
      API_ENDPOINTS.ACCOUNTS.ADMIN_USERS
    )

    // Transform backend response to frontend format
    return {
      users: response.users.map(transformAdminUser),
      count: response.count,
    }
  },
}
