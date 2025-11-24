import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  CreatePaymentSessionRequest,
  CreatePaymentSessionResponse,
} from '@features/payment/types'

export const paymentService = {
  /**
   * Create a Stripe payment session for embedded checkout
   * This should be called before showing the embedded checkout
   */
  createPaymentSession: async (data: CreatePaymentSessionRequest): Promise<CreatePaymentSessionResponse> => {
    return apiClient.post<CreatePaymentSessionResponse>(API_ENDPOINTS.PAYMENT.CREATE_SESSION, data)
  },
}

