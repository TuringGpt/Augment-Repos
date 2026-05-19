import { useEffect, useRef } from 'react'
import { Snackbar, Alert, AlertColor } from '@mui/material'
import { useUIStore } from '@store/uiStore'

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
 * Global Toast Notification Component
 *
 * Displays toast/snackbar notifications from the UI store.
 * Automatically dismisses after the specified duration (default: configured in settings).
 *
 * Usage:
 * ```tsx
 * const { addNotification } = useUIStore()
 *
 * // Success notification (uses configured default duration)
 * addNotification({ type: 'success', message: 'Item added to cart!' })
 *
 * // Error notification
 * addNotification({ type: 'error', message: 'Failed to save changes' })
 *
 * // Custom duration (in milliseconds, overrides default)
 * addNotification({ type: 'info', message: 'Processing...', duration: 3000 })
 * ```
 */
const ToastNotification = () => {
  const { notifications, removeNotification, toastDuration } = useUIStore()
  // Track timers per notification to avoid resetting existing timers when new ones are added
  const timersRef = useRef<Map<string, TimeoutId>>(new Map())

  // Clean up all timers only on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  // Manage per-notification timers without resetting existing ones
  useEffect(() => {
    const currentTimers = timersRef.current
    const currentNotificationIds = new Set(notifications.map((n) => n.id))

    // Clean up timers for removed notifications only
    currentTimers.forEach((timer, id) => {
      if (!currentNotificationIds.has(id)) {
        clearTimeout(timer)
        currentTimers.delete(id)
      }
    })

    // Set up timers for new notifications only
    notifications.forEach((notification) => {
      if (!currentTimers.has(notification.id)) {
        const duration = notification.duration ?? toastDuration // Use configured default duration
        const safeDuration = validateToastDuration(duration) // Validate before using in setTimeout
        const timer = setTimeout(() => {
          removeNotification(notification.id)
          currentTimers.delete(notification.id)
        }, safeDuration)
        currentTimers.set(notification.id, timer)
      }
    })
  }, [notifications, removeNotification, toastDuration])

  const handleClose = (id: string) => {
    removeNotification(id)
  }

  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            // Stack multiple notifications vertically
            bottom: `${24 + index * 70}px !important`,
          }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type as AlertColor}
            variant="filled"
            sx={{
              width: '100%',
              minWidth: 300,
              boxShadow: 3,
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  )
}

export default ToastNotification
