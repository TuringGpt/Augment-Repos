import { apiClient } from '@/lib/axios';

/**
 * Authentication API service
 * Handles user registration
 */

// Type definitions matching backend API
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  email: string;
  role: string;
}

/**
 * Register a new user
 * @param data - User registration data (email and password)
 * @returns Promise with registration response
 * @throws Error if registration fails
 */
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/auth/signup', data);
  return response.data;
};
