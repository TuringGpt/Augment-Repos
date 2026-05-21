// Export all API services from a single entry point
export { authService } from './auth/authService'
export { productService } from './products/productService'
export { cartService } from './cart/cartService'
export { orderService } from './orders/orderService'
export { userService } from './user/userService'
export { wishlistService } from './wishlist/wishlistService'
export { ticketService } from './support/ticketService'
export { notificationService } from './notifications/notificationService'
export { newsletterService } from './newsletter/newsletterService'
export { adminDashboardService } from './admin-dashboard/adminDashboardService'
export { adminReportService } from './admin-reports/adminReportService'
export { productStatisticsService } from './product-statistics/productStatisticsService'
export { customerStatisticsService } from './customer-statistics/customerStatisticsService'
export { accountsService } from './accounts/accountsService'
export { contactService } from './contact/contactService'
export type {
  ContactStatus,
  CreateContactRequest,
  CreateContactResponse,
  ContactItem,
  UpdateContactRequest,
  UpdateContactResponse,
  ContactListResponse,
  BulkUpdateContactRequest,
  BulkUpdateContactResponse,
} from './contact/contactService'
export { currencyService } from './currency/currencyService'
export type {
  Currency,
  CurrencyListResponse,
  CreateCurrencyRequest,
  CreateCurrencyResponse,
  UpdateCurrencyRequest,
} from './currency/currencyService'
export { paymentService } from './payment/paymentService'
export type {
  CreatePaymentSessionRequest,
  CreatePaymentSessionResponse,
  AdminPayment,
  AdminPaymentAPI,
  AdminPaymentsListResponse,
  AdminPaymentsListResponseAPI,
} from '@features/payment/types'
export type {
  AdminShippingAddress,
  AdminShippingAddressAPI,
  AdminShippingAddressesListResponse,
  AdminShippingAddressesListResponseAPI,
  AdminBillingAddress,
  AdminBillingAddressAPI,
  AdminBillingAddressesListResponse,
  AdminBillingAddressesListResponseAPI,
} from '@features/orders/types'
export { apiClient } from './client'
