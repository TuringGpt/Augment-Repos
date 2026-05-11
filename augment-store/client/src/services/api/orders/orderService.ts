import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { Order, OrderItem, CreateOrderRequest, OrderListResponse, CreateOrderResponse, OrderListAPIResponse } from '@features/orders/types'

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
   * @deprecated This function is broken due to backend serializer limitations.
   * Use getAdminOrders() to fetch the order from the list instead, or update the backend
   * to add a proper admin detail endpoint that returns full order details.
   *
   * Related backend code:
   * - View: augment-store/server/checkout/views.py - AdminOrderUpdateView
   * - Serializer: augment-store/server/checkout/serializers.py - AdminOrderUpdateSerializer
   */
  getAdminOrderById: async (_id: string): Promise<Order> => {
    // This will throw at runtime because AdminOrderUpdateSerializer only returns {id, status}
    // and does not include items, subtotal, tax, shipping, total fields
    throw new Error(
      'getAdminOrderById is not implemented. ' +
      'The backend admin detail endpoint only returns {id, status} without order items or totals. ' +
      'Use getAdminOrders() to fetch orders with full details instead.'
    )
  },
}
