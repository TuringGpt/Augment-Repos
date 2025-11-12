import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order, CreateOrderRequest, CreateOrderResponse } from '@features/orders/types'

interface OrderState {
  // Current order (most recently created)
  currentOrder: CreateOrderResponse | null

  // Loading state
  isCreatingOrder: boolean

  // Error state
  createOrderError: string | null

  // Actions
  setCurrentOrder: (order: CreateOrderResponse | null) => void
  createOrder: (data: CreateOrderRequest) => Promise<CreateOrderResponse>
  clearCurrentOrder: () => void
  setCreateOrderError: (error: string | null) => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      // Initial state
      currentOrder: null,
      isCreatingOrder: false,
      createOrderError: null,

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

      clearCurrentOrder: () => set({ currentOrder: null, createOrderError: null }),

      setCreateOrderError: (error) => set({ createOrderError: error }),
    }),
    {
      name: 'order-storage',
      partialize: (state) => ({
        // Only persist currentOrder, not loading/error states
        currentOrder: state.currentOrder,
      }),
    }
  )
)
