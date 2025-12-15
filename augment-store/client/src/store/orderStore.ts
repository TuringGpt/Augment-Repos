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
  clearOrders: () => void
  cancelOrder: (id: string) => Promise<Order>
  setPage: (page: number) => void
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

          // Clamp currentPage if it exceeds totalPages to prevent invalid pagination state
          // This can happen when orders are deleted and total pages shrinks
          const validPage = Math.min(page, Math.max(1, response.totalPages))

          // If the requested page was out of range and we have orders, refetch the valid page
          if (validPage !== page && response.totalPages > 0) {
            set({ isFetchingOrders: false })
            return get().getAllOrders(validPage, limit)
          }

          // Update state with fetched orders
          set({
            orders: response.orders,
            totalOrders: response.total,
            totalPages: response.totalPages,
            currentPage: validPage,
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

      setPage: (page: number) => {
        // Note: currentPage is now set by getAllOrders after validating against totalPages
        get().getAllOrders(page, 10).catch((error) => {
          // Error is already handled in getAllOrders, just prevent unhandled rejection
          console.error('Error fetching orders on page change:', error)
        })
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
