import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  CreatePaymentSessionRequest,
  CreatePaymentSessionResponse,
  AdminPaymentsListResponse,
  AdminPaymentsListResponseAPI,
  AdminPayment,
  AdminPaymentAPI,
} from '@features/payment/types'

/**
 * Transform backend admin payment API response to frontend format
 * Converts snake_case to camelCase while preserving string amount for exact currency representation
 */
const transformAdminPayment = (payment: AdminPaymentAPI): AdminPayment => ({
  id: payment.id,
  orderId: payment.order_id,
  customerEmail: payment.customer_email,
  amount: payment.amount, // Keep as string to avoid floating-point precision issues
  paymentMethod: payment.payment_method,
  paymentStatus: payment.payment_status,
  stripeSessionId: payment.stripe_session_id,
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
    // Validate and normalize page parameter to ensure valid 1-based page number
    // This prevents invalid values (0, negatives, non-integers) from causing backend errors
    const normalizedPage = Math.max(1, Math.floor(Number(page) || 1))

    const response = await apiClient.get<AdminPaymentsListResponseAPI>(
      API_ENDPOINTS.PAYMENT.ADMIN_LIST,
      {
        params: { page: normalizedPage },
        signal,
      }
    )

    // Transform backend response to frontend format
    const payments = response.results.map(transformAdminPayment)

    return {
      payments,
      count: response.count,
      next: response.next,
      previous: response.previous,
    }
  },
}

