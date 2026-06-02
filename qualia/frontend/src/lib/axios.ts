import axios from 'axios';

/**
 * Base API URL from environment variables
 * Should include the API version prefix (e.g., http://localhost:8000/api/v1)
 * Defaults to localhost:8000/api/v1 for development
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (if available)
    const token = localStorage.getItem('access_token');
    if (token) {
      // Ensure headers object exists
      config.headers = config.headers || {};

      // Defensively handle both AxiosHeaders instance and plain object
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Helper function to safely extract a string message from error data
 * Handles cases where detail/message might be objects, arrays, or other non-string types
 */
function extractErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return 'An error occurred';
  }

  const errorData = data as Record<string, unknown>;

  // Try to get detail or message field
  const rawDetail = errorData.detail;
  const rawMessage = errorData.message;

  // If detail exists and is a string, use it
  if (typeof rawDetail === 'string') {
    return rawDetail;
  }

  // If message exists and is a string, use it
  if (typeof rawMessage === 'string') {
    return rawMessage;
  }

  // If detail or message is an object/array, stringify it
  if (rawDetail !== undefined && rawDetail !== null) {
    try {
      return typeof rawDetail === 'object' ? JSON.stringify(rawDetail) : String(rawDetail);
    } catch {
      // Fallback if JSON.stringify fails
      return 'An error occurred';
    }
  }

  if (rawMessage !== undefined && rawMessage !== null) {
    try {
      return typeof rawMessage === 'object' ? JSON.stringify(rawMessage) : String(rawMessage);
    } catch {
      // Fallback if JSON.stringify fails
      return 'An error occurred';
    }
  }

  return 'An error occurred';
}

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
        localStorage.removeItem('refresh_token');
        // You might want to redirect to login page here
        // window.location.href = '/signin';
      }

      // Return a more user-friendly error message
      // Use helper function to ensure message is always a string
      return Promise.reject({
        status,
        message: extractErrorMessage(data),
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
