import { useEffect } from 'react'
import { Snackbar, Alert, AlertColor } from '@mui/material'
import { useUIStore } from '@store/uiStore'

/**
 * Global Toast Notification Component
 * 
 * Displays toast/snackbar notifications from the UI store.
 * Automatically dismisses after the specified duration (default: 5 seconds).
 * 
 * Usage:
 * ```tsx
 * const { addNotification } = useUIStore()
 * 
 * // Success notification
 * addNotification({ type: 'success', message: 'Item added to cart!' })
 * 
 * // Error notification
 * addNotification({ type: 'error', message: 'Failed to save changes' })
 * 
 * // Custom duration (in milliseconds)
 * addNotification({ type: 'info', message: 'Processing...', duration: 3000 })
 * ```
 */
const ToastNotification = () => {
  const { notifications, removeNotification } = useUIStore()

  // Auto-dismiss notifications after their duration
  useEffect(() => {
    if (notifications.length === 0) return

    const timers: NodeJS.Timeout[] = []

    notifications.forEach((notification) => {
      const duration = notification.duration ?? 5000 // Default 5 seconds
      const timer = setTimeout(() => {
        removeNotification(notification.id)
      }, duration)
      timers.push(timer)
    })

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [notifications, removeNotification])

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

