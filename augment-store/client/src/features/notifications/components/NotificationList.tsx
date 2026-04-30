import { useEffect } from 'react'
import {
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import { CheckCircle, Circle, Refresh as RefreshIcon } from '@mui/icons-material'
import { useNotificationStore } from '@store/notificationStore'
import { useUIStore } from '@store/uiStore'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@hooks/useTranslation'
import { formatDistanceToNow } from 'date-fns'
import { ROUTES } from '@constants/index'
import type { Notification } from '@features/notifications/types'

interface NotificationListProps {
  anchorEl: null | HTMLElement
  open: boolean
  onClose: () => void
}

const NotificationList = ({ anchorEl, open, onClose }: NotificationListProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setNotificationDetailsDrawerOpen } = useUIStore()
  const {
    menuNotifications,
    menuIsLoading,
    menuError,
    fetchNotificationsWithoutPaginationUpdate,
    markAsRead,
    markingAsRead,
    setSelectedNotification,
  } = useNotificationStore()

  // Fetch notifications when the popup opens
  // Use fetchNotificationsWithoutPaginationUpdate which populates menu-specific state
  // This prevents interfering with NotificationsPage state (notifications, isLoading, error, etc.)
  useEffect(() => {
    if (open) {
      fetchNotificationsWithoutPaginationUpdate(1, 10)
    }
  }, [open, fetchNotificationsWithoutPaginationUpdate])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id, { fromMenu: true })
      } catch (error) {
        // Error is already handled by the store (sets menuError and rolls back optimistic update)
        // Just log it here and continue to open the drawer for consistent behavior
        console.error('Failed to mark notification as read:', error)
      }
    }
    // Derive the latest notification state from the store's CURRENT state to avoid stale isRead value
    // After await markAsRead(), the menuNotifications captured in this handler's closure
    // can still be the pre-optimistic-update array, so we must read fresh state from the store
    const latestNotification =
      useNotificationStore.getState().menuNotifications.find((n) => n.id === notification.id) ??
      notification
    setSelectedNotification(latestNotification)
    setNotificationDetailsDrawerOpen(true)
    onClose()
  }

  const handleViewAll = () => {
    navigate(ROUTES.NOTIFICATIONS)
    onClose()
  }

  const handleRetry = () => {
    fetchNotificationsWithoutPaginationUpdate(1, 10)
  }

  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  return (
    <Menu
      id="notification-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      MenuListProps={{
        'aria-labelledby': 'notification-button',
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          width: 360,
          maxHeight: 480,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="h6" fontWeight="bold">
          {t('notifications.title')}
        </Typography>
      </Box>
      <Divider />

      {/* Error State */}
      {menuError && !menuIsLoading && (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
              >
                {t('common.retry')}
              </Button>
            }
          >
            {menuError}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {menuIsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!menuIsLoading && !menuError && menuNotifications.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('notifications.empty')}
          </Typography>
        </Box>
      )}

      {/* Notification Items */}
      {!menuIsLoading && !menuError && menuNotifications.length > 0 && (
        <>
          {menuNotifications.slice(0, 5).map((notification) => {
            const isMarking = markingAsRead.has(notification.id)
            return (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                disabled={isMarking}
                sx={{
                  py: 1.5,
                  px: 2,
                  backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: notification.isRead ? 'action.hover' : 'action.selected',
                  },
                }}
              >
                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'flex-start', pt: 0.5 }}>
                  {isMarking ? (
                    <CircularProgress size={20} />
                  ) : notification.isRead ? (
                    <CheckCircle fontSize="small" color="action" />
                  ) : (
                    <Circle fontSize="small" color="primary" />
                  )}
                </Box>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={notification.isRead ? 'normal' : 'bold'}
                      sx={{ mb: 0.5 }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {notification.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatNotificationTime(notification.createdAt)}
                      </Typography>
                    </>
                  }
                />
              </MenuItem>
            )
          })}
          <Divider />
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button fullWidth onClick={handleViewAll}>
              {t('notifications.viewAll')}
            </Button>
          </Box>
        </>
      )}
    </Menu>
  )
}

export default NotificationList
