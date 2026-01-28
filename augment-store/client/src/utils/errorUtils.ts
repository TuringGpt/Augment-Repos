/**
 * Utility functions for handling API errors
 */

/**
 * Django/DRF error response structure
 */
interface DjangoErrorResponse {
  // Field-specific errors (arrays of error messages)
  [key: string]: string[] | string | undefined
  // Common error fields
  detail?: string
  details?: string | string[]
  message?: string
  non_field_errors?: string[]
}

/**
 * Axios error structure
 */
interface AxiosError {
  response?: {
    data?: DjangoErrorResponse
    status?: number
  }
  message?: string
}

/**
 * Options for parsing error messages
 */
interface ParseErrorOptions {
  /**
   * Field names to check for field-specific errors (in priority order)
   * Example: ['email', 'password', 'title']
   */
  fieldNames?: string[]
  /**
   * Default error message to use if no specific error is found
   */
  defaultMessage?: string
}

/**
 * Parse error response from Django/DRF API and extract a user-friendly error message
 *
 * Priority order:
 * 1. Field-specific errors (if fieldNames provided)
 * 2. details (plural) - Django's NON_FIELD_ERRORS_KEY
 * 3. non_field_errors - Standard DRF non-field errors
 * 4. detail (singular) - Standard DRF detail field
 * 5. message - Custom message field
 * 6. error.message - Axios error message
 * 7. defaultMessage - Fallback message
 *
 * @param error - The error object from a failed API call
 * @param options - Configuration options for error parsing
 * @returns A user-friendly error message string
 *
 * @example
 * // Basic usage
 * const errorMessage = parseApiError(error, {
 *   defaultMessage: 'Failed to create ticket'
 * })
 *
 * @example
 * // With field-specific errors
 * const errorMessage = parseApiError(error, {
 *   fieldNames: ['email', 'password'],
 *   defaultMessage: 'Login failed'
 * })
 */
export function parseApiError(error: unknown, options: ParseErrorOptions = {}): string {
  const { fieldNames = [], defaultMessage = 'An error occurred. Please try again.' } = options

  // Type guard to check if error matches AxiosError structure
  const axiosError = error as AxiosError

  if (axiosError.response?.data) {
    const data = axiosError.response.data

    // Check field-specific errors first (in the order provided)
    for (const fieldName of fieldNames) {
      const fieldError = data[fieldName]
      if (fieldError) {
        // Handle both array and string formats
        const errorText = Array.isArray(fieldError) ? fieldError[0] : fieldError
        // Capitalize field name for display
        const displayFieldName = fieldName
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        return `${displayFieldName}: ${errorText}`
      }
    }

    // Check common error fields
    if (data.details) {
      return Array.isArray(data.details) ? data.details[0] : data.details
    }

    if (data.non_field_errors) {
      return data.non_field_errors[0]
    }

    if (data.detail) {
      return data.detail
    }

    if (data.message) {
      return data.message
    }
  }

  // Fallback to axios error message
  if (axiosError.message) {
    return axiosError.message
  }

  // Final fallback
  return defaultMessage
}

/**
 * Sanitized error information for safe logging
 */
interface SanitizedErrorInfo {
  status?: number
  statusText?: string
  message?: string
  errorName?: string
  url?: string
  method?: string
}

/**
 * Strip query parameters and fragments from a URL to prevent logging sensitive data
 *
 * @param url - The URL that may contain query parameters or fragments
 * @returns The URL with query parameters and fragments removed, or undefined if input is undefined
 */
function stripQueryParams(url?: string): string | undefined {
  if (!url) return url

  try {
    // Handle relative URLs
    if (url.charAt(0) === '/') {
      // Strip both query params (?) and fragments (#)
      const questionMarkIndex = url.indexOf('?')
      const hashIndex = url.indexOf('#')

      // Find the first occurrence of either ? or #
      let endIndex = -1
      if (questionMarkIndex !== -1 && hashIndex !== -1) {
        endIndex = Math.min(questionMarkIndex, hashIndex)
      } else if (questionMarkIndex !== -1) {
        endIndex = questionMarkIndex
      } else if (hashIndex !== -1) {
        endIndex = hashIndex
      }

      return endIndex === -1 ? url : url.substring(0, endIndex)
    }

    // Handle absolute URLs
    const urlObj = new URL(url)
    return `${urlObj.origin}${urlObj.pathname}`
  } catch {
    // If URL parsing fails, fall back to simple string manipulation
    // Strip both query params (?) and fragments (#)
    const questionMarkIndex = url.indexOf('?')
    const hashIndex = url.indexOf('#')

    // Find the first occurrence of either ? or #
    let endIndex = -1
    if (questionMarkIndex !== -1 && hashIndex !== -1) {
      endIndex = Math.min(questionMarkIndex, hashIndex)
    } else if (questionMarkIndex !== -1) {
      endIndex = questionMarkIndex
    } else if (hashIndex !== -1) {
      endIndex = hashIndex
    }

    return endIndex === -1 ? url : url.substring(0, endIndex)
  }
}

/**
 * Sanitize an Axios error for safe logging by removing sensitive information
 *
 * This function extracts only safe, non-sensitive information from an error object,
 * specifically excluding request config, headers (including Authorization), and other
 * potentially sensitive data that Axios includes in error objects.
 *
 * Query parameters are stripped from URLs to prevent logging sensitive data like
 * reset tokens, API keys, or other secrets that may be passed in the URL.
 *
 * @param error - The error object from a failed API call
 * @param contextMessage - Optional fallback message used only when the error has no message
 * @returns A sanitized object safe for logging
 *
 * @example
 * try {
 *   await apiClient.get('/api/data')
 * } catch (error) {
 *   console.error('Failed to fetch data:', sanitizeErrorForLogging(error))
 *   throw error
 * }
 */
export function sanitizeErrorForLogging(
  error: unknown,
  contextMessage?: string
): SanitizedErrorInfo {
  const axiosError = error as {
    name?: string
    response?: {
      status?: number
      statusText?: string
      data?: { message?: string }
    }
    message?: string
    config?: {
      url?: string
      method?: string
    }
  }

  const sanitized: SanitizedErrorInfo = {
    errorName: axiosError?.name,
    status: axiosError?.response?.status,
    statusText: axiosError?.response?.statusText,
    message: axiosError?.response?.data?.message || axiosError?.message || contextMessage,
    // Strip query parameters from URL to prevent logging sensitive data (e.g., reset tokens)
    url: stripQueryParams(axiosError?.config?.url),
    method: axiosError?.config?.method?.toUpperCase(),
  }

  return sanitized
}
