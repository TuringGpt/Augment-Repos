import { apiClient, type ApiError, safeSetLocalStorage } from '@/lib/axios';

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
 * @throws {Error} if tokens cannot be stored in localStorage (e.g., private mode, storage blocked)
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

  // Store tokens in localStorage and verify storage succeeded
  let accessTokenStored = false;
  let refreshTokenStored = false;

  if (response.data.access_token) {
    accessTokenStored = safeSetLocalStorage('access_token', response.data.access_token);
  }
  if (response.data.refresh_token) {
    refreshTokenStored = safeSetLocalStorage('refresh_token', response.data.refresh_token);
  }

  // Verify that both tokens were successfully stored
  // This prevents a "successful" login flow when localStorage is blocked (e.g., private mode)
  if (!accessTokenStored || !refreshTokenStored) {
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.error('Token storage failed:', { accessTokenStored, refreshTokenStored });
    }

    throw new Error(
      'Unable to store authentication tokens. Please check your browser settings and ensure cookies and local storage are enabled. Private browsing mode may prevent login.'
    );
  }

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Tokens successfully stored in localStorage');
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
