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
  Alert,
  Button,
} from '@mui/material'
import { CheckCircle, Circle, Refresh as RefreshIcon } from '@mui/icons-material'
import { useNotificationStore } from '@store/notificationStore'
import { useTranslation } from '@hooks/useTranslation'
import { formatDistanceToNow } from 'date-fns'

const NotificationsPage = () => {
  const { t } = useTranslation()
  const {
    notifications,
    isLoading,
    error,
    page,
    totalPages,
    unreadCount,
    fetchNotifications,
    setPage,
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications(page, 10)
  }, [page, fetchNotifications])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const handleRetry = () => {
    fetchNotifications(page, 10)
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

      {/* Error State */}
      {error && !isLoading && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={handleRetry}>
              {t('common.retry')}
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && !error && notifications.length === 0 && (
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
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              sx={{
                backgroundColor: notification.isRead ? 'background.paper' : 'action.hover',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 4,
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
          ))}
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
