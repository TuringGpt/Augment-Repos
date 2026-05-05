import { useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import {
  Close as CloseIcon,
  CheckCircle,
  Circle,
  AccessTime,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useUIStore } from '@store/uiStore'
import { useNotificationStore } from '@store/notificationStore'
import { useTranslation } from '@hooks/useTranslation'
import { useToast } from '@hooks/useToast'
import { format, formatDistanceToNow } from 'date-fns'

const NotificationDetailsDrawer = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const { isNotificationDetailsDrawerOpen, setNotificationDetailsDrawerOpen } = useUIStore()
  const { selectedNotification, deleteNotification, deletingNotifications } = useNotificationStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleClose = () => {
    setNotificationDetailsDrawerOpen(false)
    setDeleteDialogOpen(false)
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedNotification) return

    // Check if already being deleted to prevent false success toasts
    if (deletingNotifications.has(selectedNotification.id)) {
      setDeleteDialogOpen(false)
      return
    }

    try {
      setDeleteDialogOpen(false)
      // Call deleteNotification with fromMenu: false since this is from the details drawer
      // The store action will automatically close the drawer on successful delete
      await deleteNotification(selectedNotification.id, { fromMenu: false })
      toast.success(t('notifications.deleteSuccess'))
    } catch (error) {
      toast.error(t('notifications.deleteError'))
    }
  }

  const isDeleting = selectedNotification
    ? deletingNotifications.has(selectedNotification.id)
    : false

  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const formatNotificationDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp')
    } catch {
      return dateString
    }
  }

  return (
    <>
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              {selectedNotification && (
                <IconButton
                  onClick={handleDeleteClick}
                  aria-label={t('notifications.deleteNotification')}
                  disabled={isDeleting}
                  color="error"
                >
                  {isDeleting ? <CircularProgress size={24} /> : <DeleteIcon />}
                </IconButton>
              )}
              <IconButton onClick={handleClose} aria-label={t('common.close')}>
                <CloseIcon />
              </IconButton>
            </Box>
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
                {formatNotificationTime(selectedNotification.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatNotificationDate(selectedNotification.createdAt)}
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

    {/* Delete Confirmation Dialog */}
    <Dialog
      open={deleteDialogOpen}
      onClose={handleDeleteCancel}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">
        {t('notifications.deleteConfirmTitle')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          {t('notifications.deleteConfirmMessage')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDeleteCancel} disabled={isDeleting}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleDeleteConfirm}
          color="error"
          variant="contained"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          {isDeleting ? t('notifications.deleting') : t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  </>
  )
}

export default NotificationDetailsDrawer
