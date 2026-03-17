import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order, CreateOrderRequest, CreateOrderResponse, OrderListResponse } from '@features/orders/types'

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

// Request counter for merchant orders to prevent race conditions
let fetchMerchantRequestCounter = 0

interface OrderState {
  // Current order (most recently created)
  currentOrder: CreateOrderResponse | null

  // All orders list
  orders: Order[]
  totalOrders: number
  currentPage: number
  totalPages: number

  // Merchant orders list
  merchantOrders: Order[]
  totalMerchantOrders: number
  currentMerchantPage: number
  totalMerchantPages: number

  // Single order detail
  selectedOrder: Order | null
  isFetchingOrder: boolean
  fetchOrderError: string | null

  // Loading states
  isCreatingOrder: boolean
  isFetchingOrders: boolean
  isFetchingMerchantOrders: boolean
  isCancelingOrder: boolean

  // Error states
  createOrderError: string | null
  fetchOrdersError: string | null
  fetchMerchantOrdersError: string | null
  cancelOrderError: string | null

  // Actions
  setCurrentOrder: (order: CreateOrderResponse | null) => void
  createOrder: (data: CreateOrderRequest) => Promise<CreateOrderResponse>
  clearCurrentOrder: () => void
  setCreateOrderError: (error: string | null) => void
  getAllOrders: (page?: number, limit?: number) => Promise<OrderListResponse>
  getMerchantOrders: (page?: number, limit?: number) => Promise<OrderListResponse>
  getOrderById: (id: string) => Promise<Order>
  clearSelectedOrder: () => void
  clearOrders: () => void
  clearMerchantOrders: () => void
  cancelOrder: (id: string) => Promise<Order>
  setPage: (page: number) => void
  setMerchantPage: (page: number) => void
}

// Request counter to prevent race conditions in getOrderById
// When multiple getOrderById calls are made in quick succession,
// only the most recent request should update the selectedOrder state
let fetchOrderRequestCounter = 0

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentOrder: null,
      orders: [],
      totalOrders: 0,
      currentPage: 1,
      totalPages: 1,
      merchantOrders: [],
      totalMerchantOrders: 0,
      currentMerchantPage: 1,
      totalMerchantPages: 1,
      selectedOrder: null,
      isFetchingOrder: false,
      fetchOrderError: null,
      isCreatingOrder: false,
      isFetchingOrders: false,
      isFetchingMerchantOrders: false,
      isCancelingOrder: false,
      createOrderError: null,
      fetchOrdersError: null,
      fetchMerchantOrdersError: null,
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

        // Increment counter and capture the current request ID
        fetchRequestCounter += 1
        const requestId = fetchRequestCounter

        try {
          set({ isFetchingOrders: true, fetchOrdersError: null })
          const response = await orderService.getOrders(page, limit)

          // Only update state if this is still the latest request
          // This prevents older responses from overwriting newer state
          if (requestId !== fetchRequestCounter) {
            return response
          }

          // Clamp currentPage to valid range [1, totalPages] to prevent invalid pagination state
          // This can happen when orders are deleted and total pages shrinks, or if page <= 0
          const validPage = Math.max(1, Math.min(page, response.totalPages || 1))

          // If the requested page was out of range and we have orders, refetch the valid page
          if (validPage !== page && response.totalPages > 0) {
            return await get().getAllOrders(validPage, limit)
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

          // Only update error state if this is still the latest request
          if (requestId === fetchRequestCounter) {
            const errorMessage = 'Failed to fetch orders. Please try again.'
            set({ fetchOrdersError: errorMessage })
          }
          throw error
        } finally {
          // Only update loading state if this is still the latest request
          if (requestId === fetchRequestCounter) {
            set({ isFetchingOrders: false })
          }
        }
      },

      getMerchantOrders: async (page = 1, limit = 10) => {
        // Import orderService dynamically to avoid circular dependency
        const { orderService } = await import('@services/api/orders/orderService')

        // Increment counter and capture the current request ID
        fetchMerchantRequestCounter += 1
        const requestId = fetchMerchantRequestCounter

        try {
          set({ isFetchingMerchantOrders: true, fetchMerchantOrdersError: null })
          const response = await orderService.getMerchantOrders(page, limit)

          // Only update state if this is still the latest request
          // This prevents older responses from overwriting newer state
          if (requestId !== fetchMerchantRequestCounter) {
            return response
          }

          // Clamp currentMerchantPage to valid range [1, totalPages] to prevent invalid pagination state
          // This can happen when orders are deleted and total pages shrinks, or if page <= 0
          const validPage = Math.max(1, Math.min(page, response.totalPages || 1))

          // If the requested page was out of range and we have orders, refetch the valid page
          if (validPage !== page && response.totalPages > 0) {
            return await get().getMerchantOrders(validPage, limit)
          }

          // Update state with fetched merchant orders
          set({
            merchantOrders: response.orders,
            totalMerchantOrders: response.total,
            totalMerchantPages: response.totalPages,
            currentMerchantPage: validPage,
          })

          return response
        } catch (error) {
          console.error('Failed to fetch merchant orders:', error)

          // Only update error state if this is still the latest request
          if (requestId === fetchMerchantRequestCounter) {
            const errorMessage = 'Failed to fetch merchant orders. Please try again.'
            set({ fetchMerchantOrdersError: errorMessage })
          }
          throw error
        } finally {
          // Only update loading state if this is still the latest request
          if (requestId === fetchMerchantRequestCounter) {
            set({ isFetchingMerchantOrders: false })
          }
        }
      },

      getOrderById: async (id: string) => {
        // Increment counter to track this request
        // This prevents race conditions when multiple calls are made rapidly
        fetchOrderRequestCounter += 1
        const currentRequestId = fetchOrderRequestCounter

        // Set loading state and clear stale data BEFORE any awaited work
        set({ isFetchingOrder: true, fetchOrderError: null, selectedOrder: null })

        try {
          // Import orderService dynamically to avoid circular dependency
          const { orderService } = await import('@services/api/orders/orderService')
          const order = await orderService.getOrderById(id)

          // Only update state if this is still the most recent request
          // If a newer request has been made, discard this response
          if (currentRequestId === fetchOrderRequestCounter) {
            set({ selectedOrder: order })
          }

          return order
        } catch (error) {
          console.error('Failed to fetch order:', error)

          // Only update error state if this is still the most recent request
          if (currentRequestId === fetchOrderRequestCounter) {
            const errorMessage = 'Failed to fetch order. Please try again.'
            set({ fetchOrderError: errorMessage })
          }

          throw error
        } finally {
          // Only clear loading state if this is still the most recent request
          if (currentRequestId === fetchOrderRequestCounter) {
            set({ isFetchingOrder: false })
          }
        }
      },

      clearCurrentOrder: () => set({ currentOrder: null, createOrderError: null }),

      clearSelectedOrder: () => {
        // Increment counter to invalidate any in-flight fetch requests
        // This prevents in-flight responses from repopulating the store after clear
        fetchOrderRequestCounter += 1
        set({ selectedOrder: null, fetchOrderError: null, isFetchingOrder: false })
      },

      clearOrders: () => {
        // Increment counter to invalidate any in-flight fetch requests
        // This prevents in-flight responses from repopulating the store after clear
        fetchRequestCounter += 1
        set({
          orders: [],
          totalOrders: 0,
          currentPage: 1,
          totalPages: 1,
          fetchOrdersError: null,
          isFetchingOrders: false,
        })
      },

      clearMerchantOrders: () => {
        // Increment counter to invalidate any in-flight fetch requests
        // This prevents in-flight responses from repopulating the store after clear
        fetchMerchantRequestCounter += 1
        set({
          merchantOrders: [],
          totalMerchantOrders: 0,
          currentMerchantPage: 1,
          totalMerchantPages: 1,
          fetchMerchantOrdersError: null,
          isFetchingMerchantOrders: false,
        })
      },

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
        // Update currentPage optimistically so UI state remains consistent even if fetch fails
        // This ensures retry logic and pagination controls use the intended page
        set({ currentPage: page })
        get().getAllOrders(page, 10).catch((error) => {
          // Error is already handled in getAllOrders, just prevent unhandled rejection
          console.error('Error fetching orders on page change:', error)
        })
      },

      setMerchantPage: (page: number) => {
        // Update currentMerchantPage optimistically so UI state remains consistent even if fetch fails
        // This ensures retry logic and pagination controls use the intended page
        set({ currentMerchantPage: page })
        get().getMerchantOrders(page, 10).catch((error) => {
          // Error is already handled in getMerchantOrders, just prevent unhandled rejection
          console.error('Error fetching merchant orders on page change:', error)
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
