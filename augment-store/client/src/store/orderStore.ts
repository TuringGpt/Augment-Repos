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

  // Loading states
  isCreatingOrder: boolean
  isFetchingOrders: boolean

  // Error states
  createOrderError: string | null
  fetchOrdersError: string | null

  // Actions
  setCurrentOrder: (order: CreateOrderResponse | null) => void
  createOrder: (data: CreateOrderRequest) => Promise<CreateOrderResponse>
  clearCurrentOrder: () => void
  setCreateOrderError: (error: string | null) => void
  getAllOrders: (page?: number, limit?: number) => Promise<OrderListResponse>
  clearOrders: () => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      // Initial state
      currentOrder: null,
      orders: [],
      totalOrders: 0,
      currentPage: 1,
      totalPages: 1,
      isCreatingOrder: false,
      isFetchingOrders: false,
      createOrderError: null,
      fetchOrdersError: null,

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

      clearCurrentOrder: () => set({ currentOrder: null, createOrderError: null }),

      clearOrders: () =>
        set({
          orders: [],
          totalOrders: 0,
          currentPage: 1,
          totalPages: 1,
          fetchOrdersError: null,
        }),

      setCreateOrderError: (error) => set({ createOrderError: error }),
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
