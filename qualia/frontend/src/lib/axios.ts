import axios, { AxiosError } from 'axios';

/**
 * Base API URL from environment variables
 * Should include the API version prefix (e.g., http://localhost:8000/api/v1)
 * Defaults to localhost:8000/api/v1 for development
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Standardized API error interface.
 * This is the error contract returned by the axios interceptors for all errors.
 *
 * Both request and response interceptors transform errors into this standardized format
 * for consistent error handling across the application.
 *
 * @property {number} [status] - HTTP status code (e.g., 400, 401, 500). Only present for response errors.
 * @property {string} message - Human-readable error message extracted from the response or generated.
 * @property {unknown} [data] - Raw response data from the server. Only present for response errors.
 * @property {unknown} originalError - The original error instance (AxiosError or other), preserved for
 *                                      advanced use cases that need access to error.response, error.config,
 *                                      stack traces, etc. Required to ensure consistent error discrimination.
 *
 * @example
 * ```typescript
 * try {
 *   await apiClient.post('/auth/login', data);
 * } catch (error) {
 *   const apiError = error as ApiError;
 *   console.log(apiError.message); // User-friendly message
 *   console.log(apiError.status);  // HTTP status code (if available)
 *
 *   // Access original error if needed for advanced cases
 *   if ('response' in apiError.originalError) {
 *     console.log(apiError.originalError.response.headers);
 *   }
 * }
 * ```
 */
export interface ApiError {
  status?: number;
  message: string;
  data?: unknown;
  originalError: unknown;
}

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
    'Content-Type': 'application/json',
  },
});

/**
 * Safely retrieves a value from localStorage.
 * Returns null if localStorage is unavailable (SSR, tests, or blocked by browser).
 */
function safeGetLocalStorage(key: string): string | null {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(key);
  } catch {
    // localStorage access can throw when disabled/blocked
    return null;
  }
}

/**
 * Safely sets a value in localStorage.
 * Returns true if the operation succeeded, false otherwise.
 * @returns boolean indicating whether the value was successfully stored
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(key, value);
      // Verify the value was actually stored by reading it back
      return window.localStorage.getItem(key) === value;
    }
    return false;
  } catch {
    // localStorage access can throw when disabled/blocked
    return false;
  }
}

/**
 * Safely removes a value from localStorage.
 * Silently fails if localStorage is unavailable.
 */
export function safeRemoveLocalStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Silently fail if localStorage is blocked
  }
}

/**
 * Helper function to normalize any error into ApiError format
 * Ensures consistent error shape across all error paths
 */
function normalizeError(error: unknown): ApiError {
  // If it's already an ApiError, return as-is
  if (error && typeof error === 'object' && 'message' in error && 'originalError' in error) {
    return error as ApiError;
  }

  // If it's an AxiosError, we'll handle it in the response interceptor
  // But for request interceptor errors, we need to normalize here
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError;
    return {
      message: axiosError.message || 'Request configuration failed',
      originalError: axiosError,
    };
  }

  // For any other error type
  const fallbackMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  return {
    message: fallbackMessage,
    originalError: error,
  };
}

/**
 * Request interceptor to add authentication token
 * Normalizes errors to ApiError format for consistent error handling
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (if available)
    const token = safeGetLocalStorage('access_token');
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
    // Normalize request interceptor errors to ApiError format
    return Promise.reject(normalizeError(error));
  }
);

/**
 * Helper function to check if an Authorization header was sent with the request.
 * Handles both AxiosHeaders instances and plain objects, and performs case-insensitive lookup
 * to account for Axios header normalization.
 *
 * @param headers - The headers object from axiosError.config.headers
 * @returns true if an Authorization header is present, false otherwise
 */
function hasAuthorizationHeader(headers: unknown): boolean {
  if (!headers || typeof headers !== 'object') {
    return false;
  }

  // Try AxiosHeaders.get() method first (case-insensitive by default)
  if (typeof (headers as { get?: (key: string) => string | undefined }).get === 'function') {
    const value = (headers as { get: (key: string) => string | undefined }).get('Authorization');
    return !!value;
  }

  // For plain objects, check both 'Authorization' and 'authorization'
  // Axios may normalize header keys to lowercase in some configurations
  const headersObj = headers as Record<string, unknown>;
  return !!(headersObj['Authorization'] || headersObj['authorization']);
}

/**
 * Helper function to safely extract a string message from error data
 * Handles cases where detail/message might be objects, arrays, or other non-string types
 */
function extractErrorMessage(data: unknown): string {
  // Handle plain string responses from the backend
  if (typeof data === 'string') {
    return data;
  }

  // If data is not truthy or not an object, return generic message
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
 * Response interceptor for global error handling.
 *
 * Transforms all AxiosError instances into a standardized ApiError format
 * while preserving the original error for advanced use cases.
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: unknown) => {
    // Short-circuit if error is already normalized to ApiError by request interceptor
    // This prevents double-wrapping and preserves the original error structure
    if (error && typeof error === 'object' && 'message' in error && 'originalError' in error) {
      return Promise.reject(error);
    }

    // At this point, we know it's a fresh AxiosError from the network layer
    const axiosError = error as AxiosError;

    // Create standardized error object that preserves original AxiosError
    const apiError: ApiError = {
      originalError: axiosError,
      message: 'An unexpected error occurred',
    };

    // Handle specific error cases
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = axiosError.response;

      if (status === 401) {
        // Unauthorized - only clear tokens if the request actually sent an Authorization header
        // This prevents clearing tokens on failed login/signup attempts (which return 401 for invalid credentials)
        // but still clears them when an authenticated request fails due to expired/invalid token
        if (hasAuthorizationHeader(axiosError.config?.headers)) {
          safeRemoveLocalStorage('access_token');
          safeRemoveLocalStorage('refresh_token');
          // You might want to redirect to login page here
          // window.location.href = '/signin';
        }
      }

      // Populate standardized error with response data
      apiError.status = status;
      apiError.message = extractErrorMessage(data);
      apiError.data = data;
    } else if (axiosError.request) {
      // The request was made but no response was received
      apiError.message = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      apiError.message = axiosError.message || 'An unexpected error occurred';
    }

    return Promise.reject(apiError);
  }
);
