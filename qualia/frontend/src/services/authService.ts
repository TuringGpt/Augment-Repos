import { apiClient, safeSetLocalStorage } from '@/lib/axios';

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
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, authentication errors, and server errors.
 * @throws {Error} When tokens are missing in the API response or cannot be stored in localStorage
 *                 (e.g., private browsing mode, storage quota exceeded, or storage blocked by browser settings).
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Login request:', { endpoint: '/auth/login' });
  }

  const response = await apiClient.post<LoginResponse>('/auth/login', data);

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('Login response received:', { hasAccessToken: !!response.data.access_token, hasRefreshToken: !!response.data.refresh_token });
  }

  // Verify tokens are present in API response
  if (!response.data.access_token || !response.data.refresh_token) {
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.error('Invalid API response - missing tokens:', {
        hasAccessToken: !!response.data.access_token,
        hasRefreshToken: !!response.data.refresh_token
      });
    }

    throw new Error(
      'Login failed: Invalid response from server. Please try again or contact support if the problem persists.'
    );
  }

  // Store tokens in localStorage and verify storage succeeded
  const accessTokenStored = safeSetLocalStorage('access_token', response.data.access_token);
  const refreshTokenStored = safeSetLocalStorage('refresh_token', response.data.refresh_token);

  // Verify that both tokens were successfully stored
  // This prevents a "successful" login flow when localStorage is blocked (e.g., private mode)
  if (!accessTokenStored || !refreshTokenStored) {
    // Clean up any partially stored tokens to prevent inconsistent auth state
    // If one token was stored but the other failed, we need to remove the successful one
    if (accessTokenStored) {
      localStorage.removeItem('access_token');
    }
    if (refreshTokenStored) {
      localStorage.removeItem('refresh_token');
    }

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
 * @throws When the API request fails, throws an error object produced by apiClient interceptors
 *         (see ApiError interface in @/lib/axios) with properties: status?, message, data?, originalError.
 *         This includes network errors, validation errors, and server errors.
 */
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/auth/signup', data);
  return response.data;
};
