import { create } from 'zustand'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface UIState {
  isSidebarOpen: boolean
  isCartDrawerOpen: boolean
  isNotificationDetailsDrawerOpen: boolean
  isOrderDetailsDrawerOpen: boolean
  notifications: Notification[]
  isLoading: boolean

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
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isCartDrawerOpen: false,
  isNotificationDetailsDrawerOpen: false,
  isOrderDetailsDrawerOpen: false,
  notifications: [],
  isLoading: false,

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
}))
