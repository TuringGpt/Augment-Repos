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

/**
 * Contact item in list response
 */
export interface ContactItem {
  id: string
  name: string
  email: string
  subject: string
  message: string
  created_at: string
}

/**
 * Contact list response from backend
 * DRF ListAPIView returns paginated response with count, next, previous, results
 */
export interface ContactListResponse {
  count: number
  next: string | null
  previous: string | null
  results: ContactItem[]
}

export const contactService = {
  /**
   * Get all contact messages
   * @returns Promise with list of contacts
   * @throws Error if the API request fails
   */
  getContacts: async (): Promise<ContactListResponse> => {
    return apiClient.get<ContactListResponse>(API_ENDPOINTS.CONTACT.LIST)
  },

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

