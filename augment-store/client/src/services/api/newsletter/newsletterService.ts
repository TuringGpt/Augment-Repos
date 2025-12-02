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
   */
  getNewsletters: async (page = 1, limit = 10): Promise<NewsletterListResponse> => {
    try {
      const response = await apiClient.get<PaginatedNewslettersAPI>(
        API_ENDPOINTS.NEWSLETTER.LIST,
        {
          params: { page, limit },
        }
      )

      return {
        newsletters: response.results,
        total: response.count,
        page,
        limit,
        totalPages: Math.ceil(response.count / limit),
      }
    } catch (error) {
      console.error('Failed to fetch newsletters:', error)
      throw error
    }
  },
}

