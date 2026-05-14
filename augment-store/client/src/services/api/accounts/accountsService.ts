import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  AdminUsersListResponse,
  AdminUsersListResponseAPI,
  AdminUser,
  AdminUserAPI,
  AdminUserUpdateAPI,
  AdminUserDetail,
  UpdateAdminUserRequest,
} from '@features/accounts/types'
import type { UserProfile } from '@features/user/types'

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
   * Get the current user's profile
   * @returns Promise with the user's profile data
   */
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(API_ENDPOINTS.USER.PROFILE)
  },

  /**
   * Get paginated list of users (admin only)
   * Includes pagination fields (next/previous) to support fetching multiple pages
   * @param page - Page number to fetch (1-based, defaults to 1)
   * @returns Promise with list of users, total count, and pagination URLs
   */
  getAdminUsers: async (page = 1): Promise<AdminUsersListResponse> => {
    // Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
    const response = await apiClient.get<AdminUsersListResponseAPI>(
      API_ENDPOINTS.ACCOUNTS.ADMIN_USERS,
      {
        params: { page },
      }
    )

    // Transform backend response to frontend format
    // Backend returns DRF paginated response with 'results' array and pagination fields
    return {
      users: response.results.map(transformAdminUser),
      count: response.count,
      next: response.next,
      previous: response.previous,
    }
  },

  /**
   * Get a single user by ID (admin only)
   *
   * Note: The backend endpoint uses AdminUserUpdateSerializer which only returns:
   * id, email, role, is_active, date_joined
   *
   * This is a limited subset compared to the list endpoint which uses UserListSerializer.
   * Use getAdminUsers() if you need full user details including name, profile image, etc.
   *
   * @param id - User ID to fetch
   * @returns Promise with limited user details (id, email, role, isActive, dateJoined only)
   */
  getAdminUserById: async (id: string): Promise<AdminUserDetail> => {
    const response = await apiClient.get<AdminUserUpdateAPI>(
      API_ENDPOINTS.ACCOUNTS.ADMIN_USER_DETAIL(id)
    )

    // Transform backend response to frontend format
    return {
      id: response.id,
      email: response.email,
      role: response.role,
      isActive: response.is_active,
      dateJoined: response.date_joined,
    }
  },

  /**
   * Update a user by ID (admin only)
   *
   * Only role and is_active fields can be updated.
   * Other fields (id, email, date_joined) are read-only.
   *
   * Note: The backend endpoint uses AdminUserUpdateSerializer which only returns:
   * id, email, role, is_active, date_joined
   *
   * @param id - User ID to update
   * @param data - Partial user data to update (role and/or is_active)
   * @returns Promise with updated user details (id, email, role, isActive, dateJoined)
   */
  updateAdminUser: async (id: string, data: UpdateAdminUserRequest): Promise<AdminUserDetail> => {
    const response = await apiClient.patch<AdminUserUpdateAPI>(
      API_ENDPOINTS.ACCOUNTS.ADMIN_USER_DETAIL(id),
      data
    )

    // Transform backend response to frontend format
    return {
      id: response.id,
      email: response.email,
      role: response.role,
      isActive: response.is_active,
      dateJoined: response.date_joined,
    }
  },
}
