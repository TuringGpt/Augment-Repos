import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import { useAuthStore } from '@store/authStore'
import type {
  LoginRequest,
  LoginResponse,
  LoginResponseAPI,
  RegisterRequest,
  RegisterResponse,
  RegisterRequestAPI,
  RegisterResponseAPI,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
} from '@features/auth/types'

// Backend user profile response format
interface UserProfileAPI {
  id: string
  email: string
  first_name: string
  last_name: string
  username: string | null
  mobile: string | null
  gender: string | null
  image: string | null
  role: string
  is_active: boolean
  date_joined: string
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Step 1: Login and get tokens
    const loginResponse = await apiClient.post<LoginResponseAPI>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    )

    // Step 2: Fetch user profile using the access token
    // Temporarily set the token in the store so the interceptor can use it
    useAuthStore.getState().setTokens(loginResponse.access, loginResponse.refresh)

    try {
      const userProfile = await apiClient.get<UserProfileAPI>(API_ENDPOINTS.USER.PROFILE)

      // Transform backend response to frontend User type
      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role === 'admin' ? 'admin' : 'customer',
        isEmailVerified: userProfile.is_active, // Assuming is_active means email verified
        createdAt: userProfile.date_joined,
        updatedAt: userProfile.date_joined,
      }

      return {
        user,
        accessToken: loginResponse.access,
        refreshToken: loginResponse.refresh,
      }
    } catch (error) {
      // If profile fetch fails, clear the tokens
      useAuthStore.getState().logout()
      throw error
    }
  },

  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    // Transform camelCase to snake_case for Django backend
    const requestData: RegisterRequestAPI = {
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
    }

    const response = await apiClient.post<RegisterResponseAPI>(
      API_ENDPOINTS.AUTH.REGISTER,
      requestData
    )

    // Transform snake_case response to camelCase for frontend
    // No tokens returned - user must verify email first
    return {
      email: response.email,
      firstName: response.first_name,
      lastName: response.last_name,
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    // Clear auth state from Zustand store (which automatically syncs to localStorage)
    useAuthStore.getState().logout()
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data)
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    return apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data)
  },

  verifyEmail: async (token: string): Promise<void> => {
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token })
  },
}
