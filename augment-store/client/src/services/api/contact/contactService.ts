import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'

/**
 * Contact form request data
 */
export interface CreateContactRequest {
  name: string
  email: string
  subject: string
  message: string
}

/**
 * Contact form response from backend
 */
export interface CreateContactResponse {
  id: string
  name: string
  email: string
  subject: string
  message: string
  created_at: string
}

export const contactService = {
  /**
   * Create a new contact message
   * @param data - Contact form data
   * @returns Promise with created contact response
   * @throws Error if the API request fails
   */
  createContact: async (data: CreateContactRequest): Promise<CreateContactResponse> => {
    return apiClient.post<CreateContactResponse>(API_ENDPOINTS.CONTACT.CREATE, data)
  },
}

