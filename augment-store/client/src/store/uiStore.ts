import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// Constants for toast duration validation
const MIN_TOAST_DURATION = 1000 // 1 second
const MAX_TOAST_DURATION = 30000 // 30 seconds
const DEFAULT_TOAST_DURATION = 5000 // 5 seconds

/**
 * Validates and clamps toast duration to a safe range
 * Ensures setTimeout receives a safe positive number
 * @param duration - The duration to validate
 * @returns A safe, clamped duration value
 */
const validateToastDuration = (duration: number): number => {
  // Check if the value is a valid number
  if (typeof duration !== 'number' || isNaN(duration) || !isFinite(duration)) {
    return DEFAULT_TOAST_DURATION
  }

  // Clamp to safe range
  return Math.max(MIN_TOAST_DURATION, Math.min(MAX_TOAST_DURATION, duration))
}

interface UIState {
  isSidebarOpen: boolean
  isCartDrawerOpen: boolean
  isNotificationDetailsDrawerOpen: boolean
  isOrderDetailsDrawerOpen: boolean
  notifications: Notification[]
  isLoading: boolean
  toastDuration: number // Default toast duration in milliseconds

  // Actions
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  toggleCartDrawer: () => void
  setCartDrawerOpen: (isOpen: boolean) => void
  toggleNotificationDetailsDrawer: () => void
  setNotificationDetailsDrawerOpen: (isOpen: boolean) => void
  toggleOrderDetailsDrawer: () => void
  setOrderDetailsDrawerOpen: (isOpen: boolean) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  setGlobalLoading: (isLoading: boolean) => void
  setToastDuration: (duration: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: false,
      isCartDrawerOpen: false,
      isNotificationDetailsDrawerOpen: false,
      isOrderDetailsDrawerOpen: false,
      notifications: [],
      isLoading: false,
      toastDuration: DEFAULT_TOAST_DURATION,

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      openSidebar: () => set({ isSidebarOpen: true }),

      closeSidebar: () => set({ isSidebarOpen: false }),

      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

      toggleCartDrawer: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

      setCartDrawerOpen: (isOpen) => set({ isCartDrawerOpen: isOpen }),

      toggleNotificationDetailsDrawer: () =>
        set((state) => ({ isNotificationDetailsDrawerOpen: !state.isNotificationDetailsDrawerOpen })),

      setNotificationDetailsDrawerOpen: (isOpen) =>
        set({ isNotificationDetailsDrawerOpen: isOpen }),

      toggleOrderDetailsDrawer: () =>
        set((state) => ({ isOrderDetailsDrawerOpen: !state.isOrderDetailsDrawerOpen })),

      setOrderDetailsDrawerOpen: (isOpen) =>
        set({ isOrderDetailsDrawerOpen: isOpen }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id: Date.now().toString() }],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      setGlobalLoading: (isLoading) => set({ isLoading }),

      setToastDuration: (duration) => set({ toastDuration: validateToastDuration(duration) }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        toastDuration: state.toastDuration,
      }),
    }
  )
)
