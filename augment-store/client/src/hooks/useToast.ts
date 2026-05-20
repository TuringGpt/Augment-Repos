import { useCallback } from 'react'
import { useUIStore } from '@store/uiStore'

/**
 * Custom hook for displaying toast notifications
 * 
 * Provides convenient methods for showing success, error, warning, and info toasts.
 * 
 * @example
 * ```tsx
 * const toast = useToast()
 * 
 * // Show success message
 * toast.success('Item added to cart!')
 * 
 * // Show error message
 * toast.error('Failed to save changes')
 * 
 * // Show warning message
 * toast.warning('Your session is about to expire')
 * 
 * // Show info message
 * toast.info('New features available!')
 * 
 * // Custom duration (in milliseconds)
 * toast.success('Saved!', 2000)
 * ```
 */
export const useToast = () => {
  const addNotification = useUIStore((state) => state.addNotification)

  const success = useCallback(
    (message: string, duration?: number) => {
      addNotification({ type: 'success', message, duration })
    },
    [addNotification]
  )

  const error = useCallback(
    (message: string, duration?: number) => {
      addNotification({ type: 'error', message, duration })
    },
    [addNotification]
  )

  const warning = useCallback(
    (message: string, duration?: number) => {
      addNotification({ type: 'warning', message, duration })
    },
    [addNotification]
  )

  const info = useCallback(
    (message: string, duration?: number) => {
      addNotification({ type: 'info', message, duration })
    },
    [addNotification]
  )

  return {
    success,
    error,
    warning,
    info,
  }
}

