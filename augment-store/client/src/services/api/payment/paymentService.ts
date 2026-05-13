import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  CreatePaymentSessionRequest,
  CreatePaymentSessionResponse,
  AdminPaymentsListResponse,
  AdminPaymentsListResponseAPI,
  Payment,
  PaymentAPI,
} from '@features/payment/types'

/**
 * Transform backend payment API response to frontend format
 * Converts snake_case to camelCase and string amount to number
 */
const transformPayment = (payment: PaymentAPI): Payment => ({
  id: payment.id,
  amount: parseFloat(payment.amount),
  paymentMethod: payment.payment_method,
  paymentStatus: payment.payment_status,
  order: payment.order,
  createdAt: payment.created_at,
  updatedAt: payment.updated_at,
})

export const paymentService = {
  /**
   * Create a Stripe payment session for embedded checkout
   * This should be called before showing the embedded checkout
   */
  createPaymentSession: async (data: CreatePaymentSessionRequest): Promise<CreatePaymentSessionResponse> => {
    return apiClient.post<CreatePaymentSessionResponse>(API_ENDPOINTS.PAYMENT.CREATE_SESSION, data)
  },

  /**
   * Get paginated list of all payments (admin only)
   * Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
   * @param page - Page number to fetch (1-based, defaults to 1)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with list of payments, total count, and pagination URLs
   */
  getAdminPayments: async (page = 1, signal?: AbortSignal): Promise<AdminPaymentsListResponse> => {
    const response = await apiClient.get<AdminPaymentsListResponseAPI>(
      API_ENDPOINTS.PAYMENT.ADMIN_LIST,
      {
        params: { page },
        signal,
      }
    )

    // Transform backend response to frontend format
    const payments = response.results.map(transformPayment)

    return {
      payments,
      count: response.count,
      next: response.next,
      previous: response.previous,
    }
  },
}

