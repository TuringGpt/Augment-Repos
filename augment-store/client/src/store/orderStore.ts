import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order, CreateOrderRequest, CreateOrderResponse, OrderListResponse } from '@features/orders/types'
import { isAbortError } from '@utils/errorUtils'

// Request counter to track the latest fetch request
// Prevents stale responses from overwriting newer state
let fetchRequestCounter = 0

// Request counter for merchant orders to prevent race conditions
let fetchMerchantRequestCounter = 0

// Request counter for admin orders to prevent race conditions
let fetchAdminRequestCounter = 0

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

  // Admin orders list
  adminOrders: Order[]
  totalAdminOrders: number
  currentAdminPage: number
  totalAdminPages: number

  // Single order detail
  selectedOrder: Order | null
  isFetchingOrder: boolean
  fetchOrderError: string | null

  // Loading states
  isCreatingOrder: boolean
  isFetchingOrders: boolean
  isFetchingMerchantOrders: boolean
  isFetchingAdminOrders: boolean
  isCancelingOrder: boolean

  // Error states
  createOrderError: string | null
  fetchOrdersError: string | null
  fetchMerchantOrdersError: string | null
  fetchAdminOrdersError: string | null
  cancelOrderError: string | null

  // Actions
  setCurrentOrder: (order: CreateOrderResponse | null) => void
  createOrder: (data: CreateOrderRequest) => Promise<CreateOrderResponse>
  clearCurrentOrder: () => void
  setCreateOrderError: (error: string | null) => void
  getAllOrders: (page?: number) => Promise<OrderListResponse>
  getMerchantOrders: (page?: number, signal?: AbortSignal) => Promise<OrderListResponse>
  getAdminOrders: (page?: number, signal?: AbortSignal) => Promise<OrderListResponse>
  getOrderById: (id: string) => Promise<Order>
  setSelectedOrder: (order: Order | null) => void
  clearSelectedOrder: () => void
  clearOrders: () => void
  clearMerchantOrders: () => void
  clearAdminOrders: () => void
  cancelOrder: (id: string) => Promise<Order>
  setPage: (page: number) => void
  setMerchantPage: (page: number) => void
  setAdminPage: (page: number) => void
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
      adminOrders: [],
      totalAdminOrders: 0,
      currentAdminPage: 1,
      totalAdminPages: 1,
      selectedOrder: null,
      isFetchingOrder: false,
      fetchOrderError: null,
      isCreatingOrder: false,
      isFetchingOrders: false,
      isFetchingMerchantOrders: false,
      isFetchingAdminOrders: false,
      isCancelingOrder: false,
      createOrderError: null,
      fetchOrdersError: null,
      fetchMerchantOrdersError: null,
      fetchAdminOrdersError: null,
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

      getAllOrders: async (page = 1) => {
        // Import orderService dynamically to avoid circular dependency
        const { orderService } = await import('@services/api/orders/orderService')

        // Increment counter and capture the current request ID
        fetchRequestCounter += 1
        const requestId = fetchRequestCounter

        // Only clamp the lower bound to prevent page <= 0
        // Don't clamp the upper bound here because totalPages might not be accurate yet
        // (it's initialized to 1 and not persisted). The 404 retry logic below will
        // handle truly out-of-range pages, allowing deep-links to valid higher pages.
        const validPage = Math.max(1, page)

        try {
          set({ isFetchingOrders: true, fetchOrdersError: null })
          const response = await orderService.getOrders(validPage)

          // Only update state if this is still the latest request
          // This prevents older responses from overwriting newer state
          if (requestId !== fetchRequestCounter) {
            return response
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
            // Check if this is a 404 error, which likely means the requested page is out of range
            // This can happen when total pages shrink (e.g., items deleted) and the current page
            // becomes invalid. DRF PageNumberPagination returns 404 for out-of-range pages.
            const axiosError = error as { response?: { status?: number } }
            const is404Error = axiosError?.response?.status === 404

            if (is404Error && validPage > 1) {
              // Page is out of range - reset to page 1 and retry to get fresh data
              console.log(`Page ${validPage} returned 404, retrying with page 1`)
              try {
                const retryResponse = await orderService.getOrders(1)

                // Only update state if this is still the latest request
                if (requestId === fetchRequestCounter) {
                  set({
                    orders: retryResponse.orders,
                    totalOrders: retryResponse.total,
                    totalPages: retryResponse.totalPages,
                    currentPage: 1,
                    isFetchingOrders: false,
                    fetchOrdersError: null,
                  })
                }
                return retryResponse
              } catch (retryError) {
                // If retry also fails, fall through to normal error handling
                console.error('Retry with page 1 also failed:', retryError)
              }
            }

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

      getMerchantOrders: async (page = 1, signal?: AbortSignal) => {
        // Import orderService dynamically to avoid circular dependency
        const { orderService } = await import('@services/api/orders/orderService')

        // Increment counter and capture the current request ID
        fetchMerchantRequestCounter += 1
        const requestId = fetchMerchantRequestCounter

        // Only clamp the lower bound to prevent page <= 0
        // Don't clamp the upper bound here because totalMerchantPages might not be accurate yet
        // (it's initialized to 1 and not persisted). The 404 retry logic below will
        // handle truly out-of-range pages, allowing deep-links to valid higher pages.
        const validPage = Math.max(1, page)

        try {
          set({ isFetchingMerchantOrders: true, fetchMerchantOrdersError: null })
          // Note: Backend has fixed page size of 100
          const response = await orderService.getMerchantOrders(validPage, signal)

          // Only update state if this is still the latest request
          // This prevents older responses from overwriting newer state
          if (requestId !== fetchMerchantRequestCounter) {
            return response
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
          // Don't log abort errors - these are expected when requests are intentionally cancelled
          if (!isAbortError(error)) {
            console.error('Failed to fetch merchant orders:', error)
          }

          // Only update error state if this is still the latest request
          if (requestId === fetchMerchantRequestCounter) {
            // Don't treat intentional cancellations as fetch errors
            if (isAbortError(error)) {
              // Request was intentionally cancelled, don't set error state
              throw error
            }

            // Check if this is a 404 error, which likely means the requested page is out of range
            // This can happen when total pages shrink (e.g., items deleted) and the current page
            // becomes invalid. DRF PageNumberPagination returns 404 for out-of-range pages.
            const axiosError = error as { response?: { status?: number } }
            const is404Error = axiosError?.response?.status === 404

            if (is404Error && validPage > 1) {
              // Page is out of range - reset to page 1 and retry to get fresh data
              console.log(`Page ${validPage} returned 404, retrying with page 1`)
              try {
                const retryResponse = await orderService.getMerchantOrders(1, signal)

                // Only update state if this is still the latest request
                if (requestId === fetchMerchantRequestCounter) {
                  set({
                    merchantOrders: retryResponse.orders,
                    totalMerchantOrders: retryResponse.total,
                    totalMerchantPages: retryResponse.totalPages,
                    currentMerchantPage: 1,
                    isFetchingMerchantOrders: false,
                    fetchMerchantOrdersError: null,
                  })
                }
                return retryResponse
              } catch (retryError) {
                // If retry also fails, fall through to normal error handling
                // Don't log abort errors - these are expected when requests are intentionally cancelled
                if (!isAbortError(retryError)) {
                  console.error('Retry with page 1 also failed:', retryError)
                } else {
                  // Retry was also cancelled, don't set error state
                  throw retryError
                }
              }
            }

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

      getAdminOrders: async (page = 1, signal?: AbortSignal) => {
        // Import orderService dynamically to avoid circular dependency
        const { orderService } = await import('@services/api/orders/orderService')

        // Increment counter and capture the current request ID
        fetchAdminRequestCounter += 1
        const requestId = fetchAdminRequestCounter

        // Only clamp the lower bound to prevent page <= 0
        // Don't clamp the upper bound here because totalAdminPages might not be accurate yet
        // (it's initialized to 1 and not persisted). The 404 retry logic below will
        // handle truly out-of-range pages, allowing deep-links to valid higher pages.
        const validPage = Math.max(1, page)

        try {
          set({ isFetchingAdminOrders: true, fetchAdminOrdersError: null })
          // Note: Backend has fixed page size of 100
          const response = await orderService.getAdminOrders(validPage, signal)

          // Only update state if this is still the latest request
          // This prevents older responses from overwriting newer state
          if (requestId !== fetchAdminRequestCounter) {
            return response
          }

          // Update state with fetched admin orders
          set({
            adminOrders: response.orders,
            totalAdminOrders: response.total,
            totalAdminPages: response.totalPages,
            currentAdminPage: validPage,
          })

          return response
        } catch (error) {
          // Don't log abort errors - these are expected when requests are intentionally cancelled
          if (!isAbortError(error)) {
            console.error('Failed to fetch admin orders:', error)
          }

          // Only update error state if this is still the latest request
          if (requestId === fetchAdminRequestCounter) {
            // Don't treat intentional cancellations as fetch errors
            if (isAbortError(error)) {
              // Request was intentionally cancelled, don't set error state
              throw error
            }

            // Check if this is a 404 error, which likely means the requested page is out of range
            // This can happen when total pages shrink (e.g., items deleted) and the current page
            // becomes invalid. DRF PageNumberPagination returns 404 for out-of-range pages.
            const axiosError = error as { response?: { status?: number } }
            const is404Error = axiosError?.response?.status === 404

            if (is404Error && validPage > 1) {
              // Page is out of range - reset to page 1 and retry to get fresh data
              console.log(`Page ${validPage} returned 404, retrying with page 1`)
              try {
                const retryResponse = await orderService.getAdminOrders(1, signal)

                // Only update state if this is still the latest request
                if (requestId === fetchAdminRequestCounter) {
                  set({
                    adminOrders: retryResponse.orders,
                    totalAdminOrders: retryResponse.total,
                    totalAdminPages: retryResponse.totalPages,
                    currentAdminPage: 1,
                    isFetchingAdminOrders: false,
                    fetchAdminOrdersError: null,
                  })
                }
                return retryResponse
              } catch (retryError) {
                // If retry also fails, fall through to normal error handling
                // Don't log abort errors - these are expected when requests are intentionally cancelled
                if (!isAbortError(retryError)) {
                  console.error('Retry with page 1 also failed:', retryError)
                } else {
                  // Retry was also cancelled, don't set error state
                  throw retryError
                }
              }
            }

            const errorMessage = 'Failed to fetch admin orders. Please try again.'
            set({ fetchAdminOrdersError: errorMessage })
          }
          throw error
        } finally {
          // Only update loading state if this is still the latest request
          if (requestId === fetchAdminRequestCounter) {
            set({ isFetchingAdminOrders: false })
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

      setSelectedOrder: (order) => {
        // Increment counter to invalidate any in-flight fetch requests
        // This prevents in-flight getOrderById responses from overwriting the manually selected order
        fetchOrderRequestCounter += 1
        // Clear fetch-related state to prevent stale error/loading state from leaking into UI
        set({ selectedOrder: order, fetchOrderError: null, isFetchingOrder: false })
      },

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

      clearAdminOrders: () => {
        // Increment counter to invalidate any in-flight fetch requests
        // This prevents in-flight responses from repopulating the store after clear
        fetchAdminRequestCounter += 1
        set({
          adminOrders: [],
          totalAdminOrders: 0,
          currentAdminPage: 1,
          totalAdminPages: 1,
          fetchAdminOrdersError: null,
          isFetchingAdminOrders: false,
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
        get().getAllOrders(page).catch((error) => {
          // Error is already handled in getAllOrders, just prevent unhandled rejection
          console.error('Error fetching orders on page change:', error)
        })
      },

      setMerchantPage: (page: number) => {
        // Validate page before setting it optimistically to prevent invalid pagination state
        // Clamp page to valid range to match the validation in getMerchantOrders
        const currentTotalPages = get().totalMerchantPages
        const validPage = Math.max(1, currentTotalPages > 0 ? Math.min(page, currentTotalPages) : page)

        // Update currentMerchantPage optimistically so UI state remains consistent even if fetch fails
        // This ensures retry logic and pagination controls use the intended page
        set({ currentMerchantPage: validPage })
        get().getMerchantOrders(validPage).catch((error) => {
          // Error is already handled in getMerchantOrders, just prevent unhandled rejection
          // Don't log abort errors - these are expected when requests are intentionally cancelled
          if (!isAbortError(error)) {
            console.error('Error fetching merchant orders on page change:', error)
          }
        })
      },

      setAdminPage: (page: number) => {
        // Validate page before setting it optimistically to prevent invalid pagination state
        // Clamp page to valid range to match the validation in getAdminOrders
        const currentTotalPages = get().totalAdminPages
        const validPage = Math.max(1, currentTotalPages > 0 ? Math.min(page, currentTotalPages) : page)

        // Update currentAdminPage optimistically so UI state remains consistent even if fetch fails
        // This ensures retry logic and pagination controls use the intended page
        set({ currentAdminPage: validPage })
        get().getAdminOrders(validPage).catch((error) => {
          // Error is already handled in getAdminOrders, just prevent unhandled rejection
          // Don't log abort errors - these are expected when requests are intentionally cancelled
          if (!isAbortError(error)) {
            console.error('Error fetching admin orders on page change:', error)
          }
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
