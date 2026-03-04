import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'

/**
 * Contact message status type
 * Constrained to match backend API contract
 */
export type ContactStatus = 'unread' | 'read' | 'resolved'

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
  status: ContactStatus
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
  status: ContactStatus
}

/**
 * Update contact message request data
 * All fields are optional for partial updates (PATCH)
 */
export interface UpdateContactRequest {
  name?: string
  email?: string
  subject?: string
  message?: string
  status?: ContactStatus
}

/**
 * Update contact message response from backend
 */
export interface UpdateContactResponse {
  id: string
  name: string
  email: string
  subject: string
  message: string
  created_at: string
  status: ContactStatus
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
   * Get contact messages (paginated)
   * Returns the first page of contact messages. Use the `next` field in the response
   * to fetch subsequent pages if available.
   * @returns Promise with paginated list of contacts (includes count, next, previous, results)
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

  /**
   * Delete a contact message by ID
   * @param id - Contact ID to delete
   * @throws Error if the API request fails
   */
  deleteContact: async (id: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.CONTACT.DELETE(id))
  },

  /**
   * Update an existing contact message
   * @param id - Contact message ID to update
   * @param data - Partial contact message data to update
   * @returns Promise with updated contact message response
   * @throws Error if the API request fails
   */
  updateContact: async (id: string, data: UpdateContactRequest): Promise<UpdateContactResponse> => {
    return apiClient.patch<UpdateContactResponse>(API_ENDPOINTS.CONTACT.UPDATE(id), data)
  },
}

