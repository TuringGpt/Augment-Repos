import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type { Order, CreateOrderRequest, OrderListResponse } from '@features/orders/types'

export const orderService = {
  getOrders: async (page = 1, limit = 10): Promise<OrderListResponse> => {
    return apiClient.get<OrderListResponse>(API_ENDPOINTS.ORDERS.LIST, {
      params: { page, limit },
    })
  },

  getOrderById: async (id: string): Promise<Order> => {
    return apiClient.get<Order>(API_ENDPOINTS.ORDERS.DETAIL(id))
  },

  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    return apiClient.post<Order>(API_ENDPOINTS.ORDERS.CREATE, data)
  },

  cancelOrder: async (id: string): Promise<Order> => {
    return apiClient.post<Order>(API_ENDPOINTS.ORDERS.CANCEL(id))
  },
}

