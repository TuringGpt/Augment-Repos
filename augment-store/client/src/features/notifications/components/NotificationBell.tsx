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
  const { notificationSoundsEnabled } = useUIStore()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  // Track previous unread count to detect new notifications
  // Initialize to undefined to prevent sound on initial hydration
  const prevUnreadCountRef = useRef<number | undefined>(undefined)

  // Fetch unread count when component mounts (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
    }
  }, [isAuthenticated, fetchUnreadCount])

  // Play sound when unread count increases (new notifications arrive)
  useEffect(() => {
    // Only play sound if:
    // 1. User is authenticated
    // 2. Previous count is defined (not initial mount)
    // 3. Current count is greater than previous count (new notification)
    if (
      isAuthenticated &&
      prevUnreadCountRef.current !== undefined &&
      unreadCount > prevUnreadCountRef.current
    ) {
      playNotificationSoundIfEnabled(notificationSoundsEnabled)
    }

    // Update the previous count reference
    prevUnreadCountRef.current = unreadCount
  }, [unreadCount, isAuthenticated, notificationSoundsEnabled])

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
