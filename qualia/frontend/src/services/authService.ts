import { apiClient, type ApiError } from '@/lib/axios';

/**
 * Authentication API service
 * Handles user authentication (login and registration)
 */

// Type definitions matching backend API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  email: string;
  role: string;
}

/**
 * Login a user
 * @param data - User login credentials (email and password)
 * @returns Promise with login response containing access and refresh tokens
 * @throws {ApiError} if login fails (with status, message, data, and originalError)
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Login request:', { email: data.email, endpoint: '/auth/login' });
  }

  const response = await apiClient.post<LoginResponse>('/auth/login', data);

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Login response received:', { hasAccessToken: !!response.data.access_token, hasRefreshToken: !!response.data.refresh_token });
  }

  // Store tokens in localStorage
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }
  if (response.data.refresh_token) {
    localStorage.setItem('refresh_token', response.data.refresh_token);
  }

  return response.data;
};

/**
 * Register a new user
 * @param data - User registration data (email and password)
 * @returns Promise with registration response
 * @throws {ApiError} if registration fails (with status, message, data, and originalError)
 */
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/auth/signup', data);
  return response.data;
};
