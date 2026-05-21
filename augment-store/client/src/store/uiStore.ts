import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ToastPosition, NotificationSoundPreset } from '@constants/index'
import {
  DEFAULT_TOAST_POSITION,
  TOAST_POSITION_OPTIONS,
  DEFAULT_NOTIFICATION_SOUND_PRESET,
  NOTIFICATION_SOUND_PRESETS
} from '@constants/index'

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

/**
 * Validates toast position to ensure it's a valid key in TOAST_POSITION_OPTIONS
 * Prevents undefined access when retrieving position from TOAST_POSITION_OPTIONS
 * @param position - The position to validate
 * @returns A valid ToastPosition, or DEFAULT_TOAST_POSITION if invalid
 */
const validateToastPosition = (position: unknown): ToastPosition => {
  // Check if position is a valid own property key in TOAST_POSITION_OPTIONS
  // Using hasOwnProperty to avoid prototype pollution (e.g., "__proto__", "toString")
  if (
    typeof position === 'string' &&
    Object.prototype.hasOwnProperty.call(TOAST_POSITION_OPTIONS, position)
  ) {
    return position as ToastPosition
  }

  return DEFAULT_TOAST_POSITION
}

/**
 * Validates notification sounds enabled setting to ensure it's a boolean
 * Prevents non-boolean values from corrupted/edited localStorage
 * @param enabled - The value to validate
 * @returns A boolean value, defaults to false if invalid (opt-in behavior)
 */
const validateNotificationSoundsEnabled = (enabled: unknown): boolean => {
  // Check if the value is a valid boolean
  if (typeof enabled === 'boolean') {
    return enabled
  }

  // Default to false for invalid values (opt-in behavior)
  return false
}

/**
 * Validates notification sound preset to ensure it's a valid preset key
 * Prevents invalid preset values from corrupted/edited localStorage
 * @param preset - The preset value to validate
 * @returns A valid NotificationSoundPreset, or DEFAULT_NOTIFICATION_SOUND_PRESET if invalid
 */
const validateNotificationSoundPreset = (preset: unknown): NotificationSoundPreset => {
  // Check if preset is a valid own property key in NOTIFICATION_SOUND_PRESETS
  if (
    typeof preset === 'string' &&
    Object.prototype.hasOwnProperty.call(NOTIFICATION_SOUND_PRESETS, preset)
  ) {
    return preset as NotificationSoundPreset
  }

  return DEFAULT_NOTIFICATION_SOUND_PRESET
}

interface UIState {
  isSidebarOpen: boolean
  isCartDrawerOpen: boolean
  isNotificationDetailsDrawerOpen: boolean
  isOrderDetailsDrawerOpen: boolean
  notifications: Notification[]
  isLoading: boolean
  toastDuration: number // Default toast duration in milliseconds
  toastPosition: ToastPosition // Default toast position
  notificationSoundsEnabled: boolean // Enable/disable notification sounds
  notificationSoundPreset: NotificationSoundPreset // Selected notification sound preset

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
  setToastPosition: (position: ToastPosition) => void
  setNotificationSoundsEnabled: (enabled: boolean) => void
  setNotificationSoundPreset: (preset: NotificationSoundPreset) => void
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
      toastPosition: DEFAULT_TOAST_POSITION,
      notificationSoundsEnabled: false, // Notification sounds disabled by default (opt-in)
      notificationSoundPreset: DEFAULT_NOTIFICATION_SOUND_PRESET,

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

      setToastPosition: (position) => set({ toastPosition: validateToastPosition(position) }),

      setNotificationSoundsEnabled: (enabled) => set({ notificationSoundsEnabled: validateNotificationSoundsEnabled(enabled) }),

      setNotificationSoundPreset: (preset) => set({ notificationSoundPreset: validateNotificationSoundPreset(preset) }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        toastDuration: state.toastDuration,
        toastPosition: state.toastPosition,
        notificationSoundsEnabled: state.notificationSoundsEnabled,
        notificationSoundPreset: state.notificationSoundPreset,
      }),
      onRehydrateStorage: () => (state) => {
        // Validate and normalize toastDuration, toastPosition, notificationSoundsEnabled, and notificationSoundPreset after rehydration from storage
        // Use setter methods to ensure subscribers are notified of the validated values
        if (state?.toastDuration !== undefined) {
          state.setToastDuration(state.toastDuration)
        }
        if (state?.toastPosition !== undefined) {
          state.setToastPosition(state.toastPosition)
        }
        if (state?.notificationSoundsEnabled !== undefined) {
          state.setNotificationSoundsEnabled(state.notificationSoundsEnabled)
        }
        if (state?.notificationSoundPreset !== undefined) {
          state.setNotificationSoundPreset(state.notificationSoundPreset)
        }
      },
    }
  )
)
