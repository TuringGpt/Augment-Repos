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
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@hooks/useTranslation'
import { formatDistanceToNow } from 'date-fns'
import { ROUTES } from '@constants/index'

interface NotificationListProps {
  anchorEl: null | HTMLElement
  open: boolean
  onClose: () => void
}

const NotificationList = ({ anchorEl, open, onClose }: NotificationListProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { notifications, isLoading, error, fetchNotifications } = useNotificationStore()

  const handleNotificationClick = () => {
    onClose()
  }

  const handleViewAll = () => {
    navigate(ROUTES.NOTIFICATIONS)
    onClose()
  }

  const handleRetry = () => {
    fetchNotifications(1, 10)
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
      {error && !isLoading && (
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
            {error}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && !error && notifications.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('notifications.empty')}
          </Typography>
        </Box>
      )}

      {/* Notification Items */}
      {!isLoading && notifications.length > 0 && (
        <>
          {notifications.slice(0, 5).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={handleNotificationClick}
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
                {notification.isRead ? (
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
          ))}
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
