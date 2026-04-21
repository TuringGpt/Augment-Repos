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
 * Note: Backend doesn't require email in body - ID in URL is sufficient
 */
export interface UnsubscribeNewsletterRequest {
  email?: string
}

/**
 * Newsletter unsubscribe response
 */
export interface UnsubscribeNewsletterResponse {
  email: string
}

/**
 * Newsletter unsubscribe by email request
 */
export interface UnsubscribeNewsletterByEmailRequest {
  email: string
}

/**
 * Newsletter unsubscribe by email response
 */
export interface UnsubscribeNewsletterByEmailResponse {
  email: string
}

/**
 * Newsletter item from API
 */
export interface NewsletterAPI {
  id: string
  email: string
  is_active: boolean
  created_at: string
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
  },

  /**
   * Get all newsletters from admin endpoint
   * Backend returns paginated response with count, next, previous, results
   * Note: Backend has fixed page_size of 100 (configured in settings.py)
   * The limit parameter is ignored by the backend's PageNumberPagination
   * This endpoint returns ALL newsletters (both active and inactive)
   * Requires admin authentication
   */
  getAdminNewsletters: async (page = 1): Promise<NewsletterListResponse> => {
    const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings

    const response = await apiClient.get<PaginatedNewslettersAPI>(
      API_ENDPOINTS.NEWSLETTER.ADMIN_LIST,
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
  },

  /**
   * Unsubscribe from newsletter
   * Backend expects PATCH to /newsletter/unsubscribe/<id>
   * Body is optional - ID in URL is sufficient to identify the subscription
   * Backend returns { email: string }
   * Note: This sets is_active=False on the newsletter subscription
   */
  unsubscribe: async (id: string, data?: UnsubscribeNewsletterRequest): Promise<UnsubscribeNewsletterResponse> => {
    return apiClient.patch<UnsubscribeNewsletterResponse>(API_ENDPOINTS.NEWSLETTER.UNSUBSCRIBE(id), data)
  },

  /**
   * Unsubscribe from newsletter using email address (PATCH method)
   * Backend expects PATCH to /newsletter/unsubscribe-by-email/
   * Body must contain { email: string }
   * Backend returns { email: string }
   * Note: This sets is_active=False on the newsletter subscription
   */
  unsubscribeByEmailPatch: async (data: UnsubscribeNewsletterByEmailRequest): Promise<UnsubscribeNewsletterByEmailResponse> => {
    return apiClient.patch<UnsubscribeNewsletterByEmailResponse>(API_ENDPOINTS.NEWSLETTER.UNSUBSCRIBE_BY_EMAIL, data)
  },

  /**
   * Unsubscribe from newsletter using email address (PUT method)
   * Backend expects PUT to /newsletter/unsubscribe-by-email/
   * Body must contain { email: string }
   * Backend returns { email: string }
   * Note: This sets is_active=False on the newsletter subscription
   */
  unsubscribeByEmailPut: async (data: UnsubscribeNewsletterByEmailRequest): Promise<UnsubscribeNewsletterByEmailResponse> => {
    return apiClient.put<UnsubscribeNewsletterByEmailResponse>(API_ENDPOINTS.NEWSLETTER.UNSUBSCRIBE_BY_EMAIL, data)
  },

  /**
   * Get a single newsletter subscription by ID (admin only)
   * Backend expects GET to /newsletter/admin/<id>/
   * Backend returns { id: string, email: string, is_active: boolean, created_at: string }
   * Requires admin authentication
   */
  getAdminNewsletterById: async (id: string): Promise<NewsletterAPI> => {
    return apiClient.get<NewsletterAPI>(API_ENDPOINTS.NEWSLETTER.ADMIN_DETAIL(id))
  },
}

