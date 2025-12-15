import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order, CreateOrderRequest, CreateOrderResponse, OrderListResponse } from '@features/orders/types'

interface OrderState {
  // Current order (most recently created)
  currentOrder: CreateOrderResponse | null

  // All orders list
  orders: Order[]
  totalOrders: number
  currentPage: number
  totalPages: number

  // Single order detail
  selectedOrder: Order | null
  isFetchingOrder: boolean
  fetchOrderError: string | null

  // Loading states
  isCreatingOrder: boolean
  isFetchingOrders: boolean
  isCancelingOrder: boolean

  // Error states
  createOrderError: string | null
  fetchOrdersError: string | null
  cancelOrderError: string | null

  // Actions
  setCurrentOrder: (order: CreateOrderResponse | null) => void
  createOrder: (data: CreateOrderRequest) => Promise<CreateOrderResponse>
  clearCurrentOrder: () => void
  setCreateOrderError: (error: string | null) => void
  getAllOrders: (page?: number, limit?: number) => Promise<OrderListResponse>
  getOrderById: (id: string) => Promise<Order>
  clearSelectedOrder: () => void
  clearOrders: () => void
  cancelOrder: (id: string) => Promise<Order>
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentOrder: null,
      orders: [],
      totalOrders: 0,
      currentPage: 1,
      totalPages: 1,
      selectedOrder: null,
      isFetchingOrder: false,
      fetchOrderError: null,
      isCreatingOrder: false,
      isFetchingOrders: false,
      isCancelingOrder: false,
      createOrderError: null,
      fetchOrdersError: null,
      cancelOrderError: null,

      // Actions
      setCurrentOrder: (order) => set({ currentOrder: order }),

      createOrder: async (data: CreateOrderRequest) => {
        // Import orderService dynamically to avoid circular dependency
        const { orderService } = await import('@services/api/orders/orderService')
        try {
          set({ isCreatingOrder: true, createOrderError: null })
          const order = await orderService.createOrder(data)

          // Set as current order
          set({ currentOrder: order })

          return order
        } catch (error) {
          console.error('Failed to create order:', error)
          const errorMessage = 'Failed to create order. Please try again.'
          set({ createOrderError: errorMessage })
          throw error
        } finally {
          set({ isCreatingOrder: false })
        }
      },

      getAllOrders: async (page = 1, limit = 10) => {
        // Import orderService dynamically to avoid circular dependency
        const { orderService } = await import('@services/api/orders/orderService')
        try {
          set({ isFetchingOrders: true, fetchOrdersError: null })
          const response = await orderService.getOrders(page, limit)

          // Update state with fetched orders
          set({
            orders: response.orders,
            totalOrders: response.total,
            currentPage: response.page,
            totalPages: response.totalPages,
          })

          return response
        } catch (error) {
          console.error('Failed to fetch orders:', error)
          const errorMessage = 'Failed to fetch orders. Please try again.'
          set({ fetchOrdersError: errorMessage })
          throw error
        } finally {
          set({ isFetchingOrders: false })
        }
      },

      getOrderById: async (id: string) => {
        // Import orderService dynamically to avoid circular dependency
        const { orderService } = await import('@services/api/orders/orderService')
        try {
          set({ isFetchingOrder: true, fetchOrderError: null })
          const order = await orderService.getOrderById(id)

          // Update state with fetched order
          set({ selectedOrder: order })

          return order
        } catch (error) {
          console.error('Failed to fetch order:', error)
          const errorMessage = 'Failed to fetch order. Please try again.'
          set({ fetchOrderError: errorMessage })
          throw error
        } finally {
          set({ isFetchingOrder: false })
        }
      },

      clearCurrentOrder: () => set({ currentOrder: null, createOrderError: null }),

      clearSelectedOrder: () => set({ selectedOrder: null, fetchOrderError: null }),

      clearOrders: () =>
        set({
          orders: [],
          totalOrders: 0,
          currentPage: 1,
          totalPages: 1,
          fetchOrdersError: null,
        }),

      setCreateOrderError: (error) => set({ createOrderError: error }),

      cancelOrder: async (id: string) => {
        // Import orderService dynamically to avoid circular dependency
        const { orderService } = await import('@services/api/orders/orderService')
        try {
          set({ isCancelingOrder: true, cancelOrderError: null })
          const canceledOrder = await orderService.cancelOrder(id)

          // Update the order in the orders list if it exists
          const currentOrders = get().orders
          const updatedOrders = currentOrders.map((order) =>
            order.id === id ? canceledOrder : order
          )
          set({ orders: updatedOrders })

          return canceledOrder
        } catch (error) {
          console.error('Failed to cancel order:', error)
          const errorMessage = 'Failed to cancel order. Please try again.'
          set({ cancelOrderError: errorMessage })
          throw error
        } finally {
          set({ isCancelingOrder: false })
        }
      },
    }),
    {
      name: 'order-storage',
      partialize: (state) => ({
        // Only persist currentOrder, not loading/error states or orders list
        currentOrder: state.currentOrder,
      }),
    }
  )
)
