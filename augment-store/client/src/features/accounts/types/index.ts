// User data structure from backend API (snake_case)
export interface AdminUserAPI {
  id: string
  email: string
  first_name: string
  last_name: string
  username: string | null
  mobile: string | null
  gender: string | null
  image: string | null
  role: 'customer' | 'admin'
  is_active: boolean
  date_joined: string
}

// Frontend user data structure (camelCase)
export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  username: string | null
  mobile: string | null
  gender: string | null
  image: string | null
  role: 'customer' | 'admin'
  isActive: boolean
  dateJoined: string
}

// Response from GET /api/v1/accounts/admin/users/
export interface AdminUsersListResponse {
  users: AdminUser[]
  count: number
}

// Backend API response format (DRF ListAPIView with pagination)
export interface AdminUsersListResponseAPI {
  count: number
  next: string | null
  previous: string | null
  results: AdminUserAPI[]
}
