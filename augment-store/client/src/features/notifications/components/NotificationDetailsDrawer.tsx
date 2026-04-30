import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  CheckCircle,
  Circle,
  AccessTime,
} from '@mui/icons-material'
import { useUIStore } from '@store/uiStore'
import { useNotificationStore } from '@store/notificationStore'
import { useTranslation } from '@hooks/useTranslation'
import { format, formatDistanceToNow } from 'date-fns'

const NotificationDetailsDrawer = () => {
  const { t } = useTranslation()
  const { isNotificationDetailsDrawerOpen, setNotificationDetailsDrawerOpen } = useUIStore()
  const { selectedNotification } = useNotificationStore()

  const handleClose = () => {
    setNotificationDetailsDrawerOpen(false)
  }

  return (
    <Drawer
      anchor="right"
      open={isNotificationDetailsDrawerOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 480 },
          maxWidth: '100%',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('notifications.details')}
          </Typography>
          <IconButton onClick={handleClose} aria-label={t('common.close')}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        {selectedNotification ? (
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {/* Status Chip */}
            <Box sx={{ mb: 3 }}>
              <Chip
                icon={selectedNotification.isRead ? <CheckCircle /> : <Circle />}
                label={
                  selectedNotification.isRead
                    ? t('notifications.read')
                    : t('notifications.unread')
                }
                color={selectedNotification.isRead ? 'default' : 'primary'}
                size="small"
              />
            </Box>

            {/* Title */}
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              {selectedNotification.title}
            </Typography>

            {/* Timestamp */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatDistanceToNow(new Date(selectedNotification.createdAt), {
                  addSuffix: true,
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(new Date(selectedNotification.createdAt), 'PPp')}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Description */}
            <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
              {selectedNotification.description}
            </Typography>

            {/* Metadata */}
            {(selectedNotification.model || selectedNotification.objectId) && (
              <>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('notifications.metadata')}
                  </Typography>
                  {selectedNotification.model && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('notifications.type')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {selectedNotification.model}
                      </Typography>
                    </Box>
                  )}
                  {selectedNotification.objectId && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('notifications.objectId')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {selectedNotification.objectId}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              {t('notifications.noSelection')}
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default NotificationDetailsDrawer
