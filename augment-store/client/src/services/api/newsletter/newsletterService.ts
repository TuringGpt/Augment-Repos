import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'

/**
 * Newsletter subscription request
 */
export interface SubscribeNewsletterRequest {
  email: string
}

/**
 * Newsletter subscription response
 */
export interface SubscribeNewsletterResponse {
  email: string
}

/**
 * Newsletter unsubscribe request
 */
export interface UnsubscribeNewsletterRequest {
  email: string
}

/**
 * Newsletter unsubscribe response
 */
export interface UnsubscribeNewsletterResponse {
  email: string
}

/**
 * Newsletter item from API
 */
export interface NewsletterAPI {
  email: string
}

/**
 * Paginated newsletter list response from API
 */
export interface PaginatedNewslettersAPI {
  count: number
  next: string | null
  previous: string | null
  results: NewsletterAPI[]
}

/**
 * Newsletter list response for frontend
 */
export interface NewsletterListResponse {
  newsletters: NewsletterAPI[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const newsletterService = {
  /**
   * Subscribe to newsletter
   * Backend expects { email: string }
   * Backend returns { email: string }
   */
  subscribe: async (data: SubscribeNewsletterRequest): Promise<SubscribeNewsletterResponse> => {
    return apiClient.post<SubscribeNewsletterResponse>(API_ENDPOINTS.NEWSLETTER.SUBSCRIBE, data)
  },

  /**
   * Get newsletters from backend API
   * Backend returns paginated response with count, next, previous, results
   * Note: Backend has fixed page_size of 100 (configured in settings.py)
   * The limit parameter is ignored by the backend's PageNumberPagination
   */
  getNewsletters: async (page = 1): Promise<NewsletterListResponse> => {
    try {
      const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings

      const response = await apiClient.get<PaginatedNewslettersAPI>(
        API_ENDPOINTS.NEWSLETTER.LIST,
        {
          params: { page },
        }
      )

      return {
        newsletters: response.results,
        total: response.count,
        page,
        limit: backendPageSize,
        totalPages: Math.ceil(response.count / backendPageSize),
      }
    } catch (error) {
      console.error('Failed to fetch newsletters:', error)
      throw error
    }
  },

  /**
   * Unsubscribe from newsletter
   * Backend expects PATCH/PUT to /newsletter/unsubscribe/<id> with { email: string }
   * Backend returns { email: string }
   * Note: This sets is_active=False on the newsletter subscription
   */
  unsubscribe: async (id: string, data: UnsubscribeNewsletterRequest): Promise<UnsubscribeNewsletterResponse> => {
    return apiClient.patch<UnsubscribeNewsletterResponse>(API_ENDPOINTS.NEWSLETTER.UNSUBSCRIBE(id), data)
  },
}

