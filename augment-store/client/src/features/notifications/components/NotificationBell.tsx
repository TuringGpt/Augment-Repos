import { useState, useEffect, useRef } from 'react'
import { IconButton, Badge, Tooltip } from '@mui/material'
import { Notifications as NotificationsIcon } from '@mui/icons-material'
import { useNotificationStore } from '@store/notificationStore'
import { useAuthStore } from '@store/authStore'
import { useUIStore } from '@store/uiStore'
import { useTranslation } from '@hooks/useTranslation'
import { POLLING_INTERVAL } from '@constants/index'
import { playNotificationSoundIfEnabled } from '@utils/soundUtils'
import NotificationList from './NotificationList'

const NotificationBell = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()
  const { notificationSoundsEnabled, notificationSoundPreset } = useUIStore()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  // Track previous unread count to detect new notifications
  const prevUnreadCountRef = useRef<number | undefined>(undefined)
  // Track the authenticated session to reset baseline on login
  const prevAuthRef = useRef(isAuthenticated)

  // Fetch unread count when component mounts (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
    }
  }, [isAuthenticated, fetchUnreadCount])

  // Play sound when unread count increases (new notifications arrive)
  useEffect(() => {
    // Reset baseline on login (when isAuthenticated transitions from false to true)
    if (isAuthenticated && !prevAuthRef.current) {
      prevAuthRef.current = true
      prevUnreadCountRef.current = unreadCount
      return
    }

    // Update auth tracking on logout
    if (!isAuthenticated) {
      prevAuthRef.current = false
      prevUnreadCountRef.current = undefined
      return
    }

    // Initialize baseline on first run when already authenticated
    if (prevUnreadCountRef.current === undefined) {
      prevUnreadCountRef.current = unreadCount
      return
    }

    // Only play sound if:
    // 1. Previous count exists (baseline is established)
    // 2. User is authenticated
    // 3. Count increased (new notifications arrived)
    if (isAuthenticated && unreadCount > prevUnreadCountRef.current) {
      playNotificationSoundIfEnabled(notificationSoundsEnabled, notificationSoundPreset)
    }

    // Always update the reference for subsequent comparisons
    prevUnreadCountRef.current = unreadCount
  }, [unreadCount, isAuthenticated, notificationSoundsEnabled, notificationSoundPreset])

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [isAuthenticated, fetchUnreadCount])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <Tooltip title={t('tooltip.notifications')}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-label={t('tooltip.notifications')}
          aria-controls={open ? 'notification-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          id="notification-button"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <NotificationList anchorEl={anchorEl} open={open} onClose={handleClose} />
    </>
  )
}

export default NotificationBell
