import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { Order, CreateOrderRequest, OrderListResponse, CreateOrderResponse, OrderListAPIResponse } from '@features/orders/types'
import type { Address } from '@features/user/types'

const createEmptyAddress = (): Address => ({
  id: '',
  type: 'shipping',
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
  isDefault: false,
})

export const orderService = {
  getOrders: async (page = 1, limit = 10): Promise<OrderListResponse> => {
    const response = await apiClient.get<OrderListAPIResponse>(API_ENDPOINTS.ORDERS.LIST, {
      params: { page, limit },
    })

    const orders: Order[] = response.results.map((orderAPI) => ({
      id: orderAPI.id,
      orderNumber: `ORD-${orderAPI.id.slice(0, 8).toUpperCase()}`,
      items: orderAPI.items.map((item) => item.cart_item),
      subtotal: orderAPI.subtotal,
      tax: orderAPI.tax,
      shipping: orderAPI.shipping,
      total: orderAPI.total,
      status: orderAPI.status,
      shippingAddress: createEmptyAddress(),
      billingAddress: createEmptyAddress(),
      paymentMethod: '',
      paymentStatus: 'pending',
      createdAt: orderAPI.created_at,
      updatedAt: orderAPI.updated_at,
    }))

    return {
      orders,
      total: response.count,
      page,
      limit,
      totalPages: Math.ceil(response.count / limit),
    }
  },

  getOrderById: async (id: string): Promise<Order> => {
    return apiClient.get<Order>(API_ENDPOINTS.ORDERS.DETAIL(id))
  },

  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    return apiClient.post<CreateOrderResponse>(API_ENDPOINTS.ORDERS.CREATE, data)
  },

  cancelOrder: async (id: string): Promise<Order> => {
    return apiClient.post<Order>(API_ENDPOINTS.ORDERS.CANCEL(id))
  },
}
