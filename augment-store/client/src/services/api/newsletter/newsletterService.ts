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

export const newsletterService = {
  /**
   * Subscribe to newsletter
   * Backend expects { email: string }
   * Backend returns { email: string }
   */
  subscribe: async (data: SubscribeNewsletterRequest): Promise<SubscribeNewsletterResponse> => {
    return apiClient.post<SubscribeNewsletterResponse>(API_ENDPOINTS.NEWSLETTER.SUBSCRIBE, data)
  },
}

