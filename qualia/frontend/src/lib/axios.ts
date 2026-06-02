import axios from 'axios';

/**
 * Base API URL from environment variables
 * Defaults to localhost:8000 for development
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Configured axios instance for API calls
 * - Base URL from environment variables
 * - JSON content type
 * - 10 second timeout
 * - Automatic error handling
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
  },
});

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptor.request.use(
  (config) => {
    // Get token from localStorage (if available)
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for global error handling
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;

      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refreshToken');
        // You might want to redirect to login page here
        // window.location.href = '/signin';
      }
      
      // Return a more user-friendly error message
      return Promise.reject({
        status,
        message: data?.detail || data?.message || 'An error occurred',
        data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject({
        message: 'No response from server. Please check your connection.',
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
);
