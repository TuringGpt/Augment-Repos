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
 * Maps UserListSerializer fields from the backend to frontend AdminUser type
 */
const transformAdminUser = (apiUser: AdminUserAPI): AdminUser => {
  return {
    id: apiUser.id,
    email: apiUser.email,
    username: apiUser.username,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    fullName: apiUser.full_name,
    profileImage: apiUser.profile_image,
    role: apiUser.role,
    preferredCurrency: apiUser.preferred_currency,
    isActive: apiUser.is_active,
    dateJoined: apiUser.date_joined,
  }
}

export const accountsService = {
  /**
   * Get paginated list of users (admin only)
   * Note: Returns only the first page of results from the DRF-paginated response.
   * @returns Promise with list of users (first page) and total count
   */
  getAdminUsers: async (): Promise<AdminUsersListResponse> => {
    const response = await apiClient.get<AdminUsersListResponseAPI>(
      API_ENDPOINTS.ACCOUNTS.ADMIN_USERS
    )

    // Transform backend response to frontend format
    // Backend returns DRF paginated response with 'results' array
    return {
      users: response.results.map(transformAdminUser),
      count: response.count,
    }
  },
}
