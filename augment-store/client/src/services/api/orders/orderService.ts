import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  Order,
  OrderItem,
  CreateOrderRequest,
  OrderListResponse,
  CreateOrderResponse,
  OrderListAPIResponse,
  UpdateAdminOrderRequest,
  AdminOrderUpdateAPI,
  AdminShippingAddressesListResponse,
  AdminShippingAddressesListResponseAPI,
  AdminShippingAddressAPI,
  AdminShippingAddress,
  AdminBillingAddressesListResponse,
  AdminBillingAddressesListResponseAPI,
  AdminBillingAddressAPI,
  AdminBillingAddress,
} from '@features/orders/types'

export const orderService = {
  getOrders: async (page = 1): Promise<OrderListResponse> => {
    // Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
    const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings

    const response = await apiClient.get<OrderListAPIResponse>(API_ENDPOINTS.ORDERS.LIST, {
      params: { page },
    })

    const orders: Order[] = response.results.map((orderAPI) => {
      // Transform OrderItemAPI[] to OrderItem[]
      // Backend returns: { id, cart_item (UUID or null), product, quantity, created_at }
      // Frontend expects: { id, cart_item: CartItem | null, created_at }
      // When cart_item is null (deleted), we still construct a CartItem with the snapshot
      // data (product/quantity) from the backend and mark it as deleted so UIs can display it
      const items: OrderItem[] = orderAPI.items.map((itemAPI) => ({
        id: itemAPI.id,
        cart_item: {
          id: itemAPI.cart_item ?? '', // Use empty string when cart_item was deleted
          product: itemAPI.product,
          quantity: itemAPI.quantity,
          created_at: itemAPI.created_at,
          updated_at: itemAPI.created_at, // Not provided by backend, use created_at
          is_deleted: itemAPI.cart_item === null, // Mark as deleted when cart_item ID is null
          created_by: '', // Not provided by backend
        },
        created_at: itemAPI.created_at,
      }))

      return {
        id: orderAPI.id,
        items,
        subtotal: orderAPI.subtotal,
        tax: orderAPI.tax,
        shipping: orderAPI.shipping,
        total: orderAPI.total,
        status: orderAPI.status,
        shipping_address: null,
        billing_address: null,
        payment_status: null, // Backend doesn't return payment info, so we set it to null to indicate unknown status
        payment: undefined,
        created_at: orderAPI.created_at,
        updated_at: orderAPI.updated_at,
        created_by: '',
        is_deleted: false,
      }
    })

    return {
      orders,
      total: response.count,
      page,
      limit: backendPageSize,
      // Normalize totalPages to minimum of 1 for pagination UI compatibility (1-based pagination)
      // When count is 0, Math.ceil returns 0, but pagination consumers expect at least 1 page
      totalPages: Math.max(1, Math.ceil(response.count / backendPageSize)),
    }
  },

  getOrderById: async (id: string): Promise<Order> => {
    const orderAPI = await apiClient.get<OrderListAPIResponse['results'][0]>(API_ENDPOINTS.ORDERS.DETAIL(id))

    // Transform OrderItemAPI[] to OrderItem[] - same as getOrders
    // Backend returns: { id, cart_item (UUID or null), product, quantity, created_at }
    // Frontend expects: { id, cart_item: CartItem | null, created_at }
    // When cart_item is null (deleted), we still construct a CartItem with the snapshot
    // data (product/quantity) from the backend and mark it as deleted so UIs can display it
    const items: OrderItem[] = orderAPI.items.map((itemAPI) => ({
      id: itemAPI.id,
      cart_item: {
        id: itemAPI.cart_item ?? '', // Use empty string when cart_item was deleted
        product: itemAPI.product,
        quantity: itemAPI.quantity,
        created_at: itemAPI.created_at,
        updated_at: itemAPI.created_at, // Not provided by backend, use created_at
        is_deleted: itemAPI.cart_item === null, // Mark as deleted when cart_item ID is null
        created_by: '', // Not provided by backend
      },
      created_at: itemAPI.created_at,
    }))

    return {
      id: orderAPI.id,
      items,
      subtotal: orderAPI.subtotal,
      tax: orderAPI.tax,
      shipping: orderAPI.shipping,
      total: orderAPI.total,
      status: orderAPI.status,
      shipping_address: null,
      billing_address: null,
      payment_status: null, // Backend doesn't return payment info, so we set it to null to indicate unknown status
      payment: undefined,
      created_at: orderAPI.created_at,
      updated_at: orderAPI.updated_at,
      created_by: '',
      is_deleted: false,
    }
  },

  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    return apiClient.post<CreateOrderResponse>(API_ENDPOINTS.ORDERS.CREATE, data)
  },

  cancelOrder: async (id: string): Promise<Order> => {
    const orderAPI = await apiClient.post<OrderListAPIResponse['results'][0]>(API_ENDPOINTS.ORDERS.CANCEL(id))

    // Transform OrderItemAPI[] to OrderItem[] - same as getOrders and getOrderById
    // Backend returns: { id, cart_item (UUID or null), product, quantity, created_at }
    // Frontend expects: { id, cart_item: CartItem | null, created_at }
    // When cart_item is null (deleted), we still construct a CartItem with the snapshot
    // data (product/quantity) from the backend and mark it as deleted so UIs can display it
    const items: OrderItem[] = orderAPI.items.map((itemAPI) => ({
      id: itemAPI.id,
      cart_item: {
        id: itemAPI.cart_item ?? '', // Use empty string when cart_item was deleted
        product: itemAPI.product,
        quantity: itemAPI.quantity,
        created_at: itemAPI.created_at,
        updated_at: itemAPI.created_at, // Not provided by backend, use created_at
        is_deleted: itemAPI.cart_item === null, // Mark as deleted when cart_item ID is null
        created_by: '', // Not provided by backend
      },
      created_at: itemAPI.created_at,
    }))

    return {
      id: orderAPI.id,
      items,
      subtotal: orderAPI.subtotal,
      tax: orderAPI.tax,
      shipping: orderAPI.shipping,
      total: orderAPI.total,
      status: orderAPI.status,
      shipping_address: null,
      billing_address: null,
      payment_status: null, // Backend doesn't return payment info, so we set it to null to indicate unknown status
      payment: undefined,
      created_at: orderAPI.created_at,
      updated_at: orderAPI.updated_at,
      created_by: '',
      is_deleted: false,
    }
  },

  getMerchantOrders: async (page = 1, signal?: AbortSignal): Promise<OrderListResponse> => {
    // Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
    const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings

    const response = await apiClient.get<OrderListAPIResponse>(API_ENDPOINTS.ORDERS.MERCHANT_LIST, {
      params: { page },
      signal,
    })

    const orders: Order[] = response.results.map((orderAPI) => {
      // Transform OrderItemAPI[] to OrderItem[]
      // Backend returns: { id, cart_item (UUID or null), product, quantity, created_at }
      // Frontend expects: { id, cart_item: CartItem | null, created_at }
      // When cart_item is null (deleted), we still construct a CartItem with the snapshot
      // data (product/quantity) from the backend and mark it as deleted so UIs can display it
      const items: OrderItem[] = orderAPI.items.map((itemAPI) => ({
        id: itemAPI.id,
        cart_item: {
          id: itemAPI.cart_item ?? '', // Use empty string when cart_item was deleted
          product: itemAPI.product,
          quantity: itemAPI.quantity,
          created_at: itemAPI.created_at,
          updated_at: itemAPI.created_at, // Not provided by backend, use created_at
          is_deleted: itemAPI.cart_item === null, // Mark as deleted when cart_item ID is null
          created_by: '', // Not provided by backend
        },
        created_at: itemAPI.created_at,
      }))

      return {
        id: orderAPI.id,
        items,
        subtotal: orderAPI.subtotal,
        tax: orderAPI.tax,
        shipping: orderAPI.shipping,
        total: orderAPI.total,
        status: orderAPI.status,
        shipping_address: null,
        billing_address: null,
        payment_status: null, // Backend doesn't return payment info, so we set it to null to indicate unknown status
        payment: undefined,
        created_at: orderAPI.created_at,
        updated_at: orderAPI.updated_at,
        created_by: '',
        is_deleted: false,
      }
    })

    return {
      orders,
      total: response.count,
      page,
      limit: backendPageSize,
      // Normalize totalPages to minimum of 1 for pagination UI compatibility (1-based pagination)
      // When count is 0, Math.ceil returns 0, but pagination consumers expect at least 1 page
      totalPages: Math.max(1, Math.ceil(response.count / backendPageSize)),
    }
  },

  getAdminOrders: async (page = 1, signal?: AbortSignal): Promise<OrderListResponse> => {
    // Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
    const backendPageSize = 100 // Fixed in backend REST_FRAMEWORK settings

    const response = await apiClient.get<OrderListAPIResponse>(API_ENDPOINTS.ORDERS.ADMIN_LIST, {
      params: { page },
      signal,
    })

    const orders: Order[] = response.results.map((orderAPI) => {
      // Transform OrderItemAPI[] to OrderItem[]
      // Backend returns: { id, cart_item (UUID or null), product, quantity, created_at }
      // Frontend expects: { id, cart_item: CartItem | null, created_at }
      // When cart_item is null (deleted), we still construct a CartItem with the snapshot
      // data (product/quantity) from the backend and mark it as deleted so UIs can display it
      const items: OrderItem[] = orderAPI.items.map((itemAPI) => ({
        id: itemAPI.id,
        cart_item: {
          id: itemAPI.cart_item ?? '', // Use empty string when cart_item was deleted
          product: itemAPI.product,
          quantity: itemAPI.quantity,
          created_at: itemAPI.created_at,
          updated_at: itemAPI.created_at, // Not provided by backend, use created_at
          is_deleted: itemAPI.cart_item === null, // Mark as deleted when cart_item ID is null
          created_by: '', // Not provided by backend
        },
        created_at: itemAPI.created_at,
      }))

      return {
        id: orderAPI.id,
        items,
        subtotal: orderAPI.subtotal,
        tax: orderAPI.tax,
        shipping: orderAPI.shipping,
        total: orderAPI.total,
        status: orderAPI.status,
        shipping_address: null,
        billing_address: null,
        payment_status: null, // Backend doesn't return payment info, so we set it to null to indicate unknown status
        payment: undefined,
        created_at: orderAPI.created_at,
        updated_at: orderAPI.updated_at,
        created_by: '',
        is_deleted: false,
      }
    })

    return {
      orders,
      total: response.count,
      page,
      limit: backendPageSize,
      // Normalize totalPages to minimum of 1 for pagination UI compatibility (1-based pagination)
      // When count is 0, Math.ceil returns 0, but pagination consumers expect at least 1 page
      totalPages: Math.max(1, Math.ceil(response.count / backendPageSize)),
    }
  },

  /**
   * Get a single admin order by ID
   *
   * ⚠️ NOTE: API_ENDPOINTS.ORDERS.ADMIN_DETAIL currently maps to AdminOrderUpdateView
   * which uses AdminOrderUpdateSerializer that ONLY returns {id, status}.
   * This means orderAPI.items/totals will be undefined and cause runtime errors.
   *
   * This function is typed as Promise<never> because it always throws an error and never
   * returns a value. This prevents accidental usage and ensures TypeScript catches any
   * attempt to use the result at compile time rather than failing at runtime.
   *
   * @deprecated This function is broken due to backend serializer limitations.
   * Use getAdminOrders() to fetch the order from the list instead, or update the backend
   * to add a proper admin detail endpoint that returns full order details.
   *
   * Related backend code:
   * - View: augment-store/server/checkout/views.py - AdminOrderUpdateView
   * - Serializer: augment-store/server/checkout/serializers.py - AdminOrderUpdateSerializer
   */
  getAdminOrderById: async (_id: string): Promise<never> => {
    // This will throw at runtime because AdminOrderUpdateSerializer only returns {id, status}
    // and does not include items, subtotal, tax, shipping, total fields
    throw new Error(
      'getAdminOrderById is not implemented. ' +
      'The backend admin detail endpoint only returns {id, status} without order items or totals. ' +
      'Use getAdminOrders() to fetch orders with full details instead.'
    )
  },

  /**
   * Update admin order (PATCH /api/v1/checkout/admin/orders/{id}/)
   *
   * Updates an order's status (admin only)
   * Backend returns AdminOrderUpdateSerializer with only {id, status}
   *
   * Related backend code:
   * - View: augment-store/server/checkout/views.py - AdminOrderUpdateView
   * - Serializer: augment-store/server/checkout/serializers.py - AdminOrderUpdateSerializer
   */
  updateAdminOrder: async (id: string, data: UpdateAdminOrderRequest): Promise<AdminOrderUpdateAPI> => {
    return apiClient.patch<AdminOrderUpdateAPI>(API_ENDPOINTS.ORDERS.ADMIN_DETAIL(id), data)
  },

  /**
   * Get paginated list of all shipping addresses (admin only)
   * Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
   *
   * Related backend code:
   * - View: augment-store/server/checkout/views.py - AdminShippingAddressListView
   * - Serializer: augment-store/server/checkout/serializers.py - ShippingAddressListSerializer
   *
   * @param page - Page number to fetch (1-based, defaults to 1)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with list of shipping addresses, total count, and pagination URLs
   */
  getAdminShippingAddresses: async (page = 1, signal?: AbortSignal): Promise<AdminShippingAddressesListResponse> => {
    // Validate and normalize page parameter to ensure valid 1-based page number
    // This prevents invalid values (0, negatives, non-integers, Infinity) from causing backend errors
    const pageNum = Number(page)
    const normalizedPage = Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1

    const response = await apiClient.get<AdminShippingAddressesListResponseAPI>(
      API_ENDPOINTS.ORDERS.ADMIN_SHIPPING_ADDRESSES,
      {
        params: { page: normalizedPage },
        signal,
      }
    )

    // Transform backend response to frontend format
    return {
      shippingAddresses: response.results.map(transformAdminShippingAddress),
      count: response.count,
      next: response.next,
      previous: response.previous,
    }
  },

  /**
   * Get paginated list of all billing addresses (admin only)
   * Backend uses DRF PageNumberPagination with fixed PAGE_SIZE of 100 (configured in settings.py)
   *
   * Related backend code:
   * - View: augment-store/server/checkout/views.py - AdminBillingAddressListView
   * - Serializer: augment-store/server/checkout/serializers.py - BillingAddressListSerializer
   *
   * @param page - Page number to fetch (1-based, defaults to 1)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with list of billing addresses, total count, and pagination URLs
   */
  getAdminBillingAddresses: async (page = 1, signal?: AbortSignal): Promise<AdminBillingAddressesListResponse> => {
    // Validate and normalize page parameter to ensure valid 1-based page number
    // This prevents invalid values (0, negatives, non-integers, Infinity) from causing backend errors
    const pageNum = Number(page)
    const normalizedPage = Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1

    const response = await apiClient.get<AdminBillingAddressesListResponseAPI>(
      API_ENDPOINTS.ORDERS.ADMIN_BILLING_ADDRESSES,
      {
        params: { page: normalizedPage },
        signal,
      }
    )

    // Transform backend response to frontend format
    return {
      billingAddresses: response.results.map(transformAdminBillingAddress),
      count: response.count,
      next: response.next,
      previous: response.previous,
    }
  },
}

/**
 * Transform backend admin shipping address (snake_case) to frontend format (camelCase)
 */
function transformAdminShippingAddress(address: AdminShippingAddressAPI): AdminShippingAddress {
  return {
    id: address.id,
    user: address.user,
    firstName: address.first_name,
    lastName: address.last_name,
    addressLine1: address.address_line_1,
    addressLine2: address.address_line_2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
    createdAt: address.created_at,
    updatedAt: address.updated_at,
    isDeleted: address.is_deleted,
  }
}

/**
 * Transform backend admin billing address (snake_case) to frontend format (camelCase)
 */
function transformAdminBillingAddress(address: AdminBillingAddressAPI): AdminBillingAddress {
  return {
    id: address.id,
    user: address.user,
    firstName: address.first_name,
    lastName: address.last_name,
    addressLine1: address.address_line_1,
    addressLine2: address.address_line_2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
    createdAt: address.created_at,
    updatedAt: address.updated_at,
    isDeleted: address.is_deleted,
  }
}
