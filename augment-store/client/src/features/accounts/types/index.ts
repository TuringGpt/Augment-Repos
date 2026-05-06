// File object from FileListSerializer (backend returns { id, file })
export interface FileListAPI {
  id: string
  file: string | null
}

// Currency object from ListCurrencySerializer
export interface CurrencyAPI {
  id: string
  code: string
  name: string
  symbol: string
  created_at: string
  updated_at: string
}

// User data structure from backend API (snake_case)
// Matches UserListSerializer fields from augment-store/server/accounts/serializers.py
export interface AdminUserAPI {
  id: string
  email: string
  username: string | null
  first_name: string
  last_name: string
  full_name: string
  profile_image: FileListAPI | null
  role: 'admin' | 'merchant' | 'member'
  preferred_currency: CurrencyAPI | null
  is_active: boolean
  date_joined: string
}

// User detail data structure from backend detail endpoint (snake_case)
// Matches AdminUserUpdateSerializer fields from augment-store/server/accounts/serializers.py
// Used by GET /api/v1/accounts/admin/users/<uuid:pk>/
// This serializer has limited fields compared to UserListSerializer
export interface AdminUserUpdateAPI {
  id: string
  email: string
  role: 'admin' | 'merchant' | 'member'
  is_active: boolean
  date_joined: string
}

// Frontend user detail structure (camelCase) - from detail endpoint
// Only includes fields returned by AdminUserUpdateSerializer
//
// ⚠️ WARNING: This is a PARTIAL user object with limited fields.
// DO NOT merge or spread this into AdminUser objects, as it lacks:
// - username, firstName, lastName, fullName
// - profileImage, preferredCurrency
// Treating this as a complete AdminUser will result in data loss.
// Use getAdminUsers() list endpoint if you need full user details.
export interface AdminUserDetail {
  id: string
  email: string
  role: 'admin' | 'merchant' | 'member'
  isActive: boolean
  dateJoined: string
}

// Frontend user data structure (camelCase) - from list endpoint
// Full user details with all fields
export interface AdminUser {
  id: string
  email: string
  username: string | null
  firstName: string
  lastName: string
  fullName: string
  profileImage: FileListAPI | null
  role: 'admin' | 'merchant' | 'member'
  preferredCurrency: CurrencyAPI | null
  isActive: boolean
  dateJoined: string
}

// Response from GET /api/v1/accounts/admin/users/
export interface AdminUsersListResponse {
  users: AdminUser[]
  count: number
  next: string | null
  previous: string | null
}

// Backend API response format (DRF ListAPIView with pagination)
export interface AdminUsersListResponseAPI {
  count: number
  next: string | null
  previous: string | null
  results: AdminUserAPI[]
}
