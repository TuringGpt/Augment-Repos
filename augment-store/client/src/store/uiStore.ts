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
  notifications: Notification[]
  isLoading: boolean

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  toggleCartDrawer: () => void
  setCartDrawerOpen: (isOpen: boolean) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  setGlobalLoading: (isLoading: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isCartDrawerOpen: false,
  notifications: [],
  isLoading: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  toggleCartDrawer: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

  setCartDrawerOpen: (isOpen) => set({ isCartDrawerOpen: isOpen }),

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
