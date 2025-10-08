import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@features/auth/types'

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
  },

  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    return apiClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, userData)
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
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
