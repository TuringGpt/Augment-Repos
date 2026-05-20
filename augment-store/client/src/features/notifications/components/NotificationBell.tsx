import { useState, useEffect } from 'react'
import { IconButton, Badge, Tooltip } from '@mui/material'
import { Notifications as NotificationsIcon } from '@mui/icons-material'
import { useNotificationStore } from '@store/notificationStore'
import { useAuthStore } from '@store/authStore'
import { useTranslation } from '@hooks/useTranslation'
import { POLLING_INTERVAL } from '@constants/index'
import NotificationList from './NotificationList'

const NotificationBell = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  // Fetch unread count when component mounts (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
    }
  }, [isAuthenticated, fetchUnreadCount])

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
