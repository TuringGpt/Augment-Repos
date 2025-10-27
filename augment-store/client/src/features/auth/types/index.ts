export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'customer' | 'admin'
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

// Backend API response format from Django
export interface LoginResponseAPI {
  refresh: string
  access: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

// Backend API request format (snake_case)
export interface RegisterRequestAPI {
  email: string
  password: string
  first_name: string
  last_name: string
}

// Backend API response format (no tokens - email verification required)
export interface RegisterResponseAPI {
  email: string
  first_name: string
  last_name: string
}

export interface RegisterResponse {
  email: string
  firstName: string
  lastName: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
