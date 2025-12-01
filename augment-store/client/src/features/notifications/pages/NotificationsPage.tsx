import { useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Pagination,
  CircularProgress,
  Chip,
} from '@mui/material'
import { CheckCircle, Circle } from '@mui/icons-material'
import { useNotificationStore } from '@store/notificationStore'
import { useTranslation } from '@hooks/useTranslation'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  getNotificationNavigationPath,
  isNotificationClickable,
} from '../utils/notificationNavigation'
import type { Notification } from '../types'

const NotificationsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    notifications,
    isLoading,
    page,
    totalPages,
    unreadCount,
    fetchNotifications,
    setPage,
    markAsRead,
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications(page, 10)
  }, [page, fetchNotifications])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // Navigate to the related page if available
    const navigationPath = getNotificationNavigationPath(notification.model, notification.objectId)
    if (navigationPath) {
      navigate(navigationPath)
    }
  }

  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {t('notifications.title')}
        </Typography>
        {unreadCount > 0 && (
          <Chip
            label={t('notifications.unreadCount', { count: unreadCount })}
            color="primary"
            size="small"
          />
        )}
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && notifications.length === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('notifications.empty')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('notifications.emptyDescription')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Notification List */}
      {!isLoading && notifications.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notifications.map((notification) => {
            const isClickable = isNotificationClickable(notification.model, notification.objectId)
            return (
              <Card
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: notification.isRead ? 'background.paper' : 'action.hover',
                  transition: 'all 0.2s',
                  cursor: isClickable ? 'pointer' : 'default',
                  '&:hover': {
                    boxShadow: isClickable ? 4 : 1,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ pt: 0.5 }}>
                      {notification.isRead ? (
                        <CheckCircle color="action" />
                      ) : (
                        <Circle color="primary" />
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={notification.isRead ? 'normal' : 'bold'}
                        gutterBottom
                      >
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {notification.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatNotificationTime(notification.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  )
}

export default NotificationsPage
