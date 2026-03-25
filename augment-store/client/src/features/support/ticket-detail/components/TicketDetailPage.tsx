import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Card,
  CardContent,
  Avatar,
  Grid,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  ButtonBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  ConfirmationNumber as TicketIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Update as UpdateIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { Trans } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import { ticketService } from '@services/api'
import type { Comment, TicketStatus, TicketPriority } from '@features/support/types'
import { formatDate } from '@utils/formatters'
import { escapeHtml } from '@utils/validators'
import { ROUTES } from '@constants/index'
import { useTranslation } from '@hooks/useTranslation'
import { useToast } from '@hooks/useToast'
import { useTicketStore } from '@store/ticketStore'
import { useAuthStore } from '@store/authStore'

// Form values interface
interface EditTicketFormValues {
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
}

/**
 * Translate error codes to user-friendly messages
 * Maps error codes to translation keys
 */
const translateErrorCode = (errorCode: string, translateFn: TFunction): string => {
  const errorKeyMap: Record<string, 'admin.ticketDetailPage.loadError' | 'admin.ticketDetailPage.commentError'> = {
    'TICKET_LOAD_ERROR': 'admin.ticketDetailPage.loadError',
    'COMMENT_SUBMIT_ERROR': 'admin.ticketDetailPage.commentError',
  }

  // If error code matches a known key, translate it
  const translationKey = errorKeyMap[errorCode]
  if (translationKey) {
    return translateFn(translationKey)
  }

  // Otherwise, return the error code as-is (may be a backend message or network error)
  return errorCode
}

const TicketDetailPage = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Use auth store to check if user is admin
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  // Use ticket store for fetching ticket details
  const {
    selectedTicket,
    isFetchingTicket,
    fetchTicketError,
    getTicketById,
    clearSelectedTicket,
    deleteTicket,
    isDeleting,
    updateTicket,
    isUpdating,
  } = useTicketStore()

  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

  // Track if we've attempted to fetch the ticket at least once
  // This prevents showing "not found" error on initial render before useEffect runs
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)

  // Validation schema with translations - memoized to update when language changes
  const editTicketSchema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(5, t('admin.createTicketPage.validation.titleMinLength'))
          .max(255, t('admin.createTicketPage.validation.titleMaxLength')),
        description: z
          .string()
          .min(20, t('admin.createTicketPage.validation.descriptionMinLength'))
          .max(2000, t('admin.createTicketPage.validation.descriptionMaxLength')),
        priority: z.enum(['low', 'medium', 'high', 'urgent']),
        status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
      }),
    [t]
  )

  const editForm = useForm({
    initialValues: {
      title: '',
      description: '',
      priority: 'medium' as TicketPriority,
      status: 'open' as TicketStatus,
    },
    // Use a validation function that references the memoized schema
    // This ensures validation messages always match the active locale
    validate: (values) => zodResolver(editTicketSchema)(values),
  })

  // Clear anchorEl when isAdmin becomes false to prevent stale menu state
  useEffect(() => {
    if (!isAdmin && anchorEl) {
      setAnchorEl(null)
    }
  }, [isAdmin, anchorEl])

  // Track the current request ID to prevent race conditions
  // If id changes while a request is in-flight, we only update hasFetchedOnce for the latest id
  const currentRequestIdRef = useRef<string | undefined>(undefined)

  const fetchComments = useCallback(async () => {
    if (!id) return

    try {
      const response = await ticketService.getComments(id)
      setComments(response.results)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }, [id])

  useEffect(() => {
    let isMounted = true

    if (id) {
      // Reset hasFetchedOnce when id changes to show loading state
      setHasFetchedOnce(false)
      // Reset delete dialog state when id changes to prevent operating on wrong ticket
      setDeleteDialogOpen(false)
      // Reset menu state when id changes to prevent stale menu for different ticket
      setAnchorEl(null)

      // Fetch ticket details with mount check
      const fetchWithMountCheck = async () => {
        const requestId = id
        currentRequestIdRef.current = requestId

        try {
          await getTicketById(id)
        } catch (err) {
          // Error is already logged and handled by the store
        } finally {
          // Only update hasFetchedOnce if:
          // 1. Component is still mounted
          // 2. This request is still for the current id (prevents race conditions)
          if (isMounted && currentRequestIdRef.current === requestId) {
            setHasFetchedOnce(true)
          }
        }
      }

      fetchWithMountCheck()
      fetchComments()
    }

    // Cleanup: clear selected ticket and mark component as unmounted
    return () => {
      isMounted = false
      clearSelectedTicket()
    }
  }, [id, getTicketById, fetchComments, clearSelectedTicket])

  const handleSubmitComment = async () => {
    if (!id || !commentText.trim()) return

    setIsSubmittingComment(true)
    setCommentError(null)

    try {
      await ticketService.createComment(id, { content: commentText })
      setCommentText('')
      // Refresh comments
      await fetchComments()
    } catch (err) {
      console.error('Failed to submit comment:', err)
      // Store error code instead of translated message
      // Translation happens in the render phase
      setCommentError('COMMENT_SUBMIT_ERROR')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleBack = () => {
    navigate(ROUTES.SUPPORT_TICKETS)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEditTicket = () => {
    handleMenuClose()

    // Populate form with current ticket data
    if (selectedTicket) {
      editForm.setValues({
        title: selectedTicket.title,
        description: selectedTicket.description,
        priority: selectedTicket.priority,
        status: selectedTicket.status,
      })
    }

    setIsEditDrawerOpen(true)
  }

  const handleCloseEditDrawer = () => {
    // Prevent closing the drawer while an update operation is in progress
    if (isUpdating) {
      return
    }
    setIsEditDrawerOpen(false)
    editForm.reset()
  }

  const handleEditSubmit = async (values: EditTicketFormValues) => {
    // Guard against null selectedTicket to avoid state desync issues
    if (!selectedTicket) {
      console.error('Cannot update ticket: selectedTicket is null')
      return
    }

    try {
      // Call the store action to update the ticket
      await updateTicket(selectedTicket.id, {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
      })

      // Show success message via toast
      toast.success(t('admin.ticketDetailPage.updateSuccess'))

      // Close the drawer and reset form
      handleCloseEditDrawer()

      // Refresh the ticket data to show the updated information
      // Handle refresh errors separately to avoid showing update error after successful update
      try {
        await getTicketById(selectedTicket.id)
      } catch (refreshErr) {
        console.error('Failed to refresh ticket after update:', refreshErr)
        // Update succeeded but refresh failed - this is not critical
        // The user will see stale data until they manually refresh
      }
    } catch (err) {
      console.error('Failed to update ticket:', err)
      // Error is already set in the store, but show user-friendly message
      toast.error(t('admin.ticketDetailPage.updateError'))
      // Keep drawer open on error so user can retry or cancel
    }
  }

  const handleDeleteTicket = () => {
    handleMenuClose()
    setDeleteDialogOpen(true)
  }

  const handleDeleteCancel = () => {
    // Prevent closing dialog during deletion
    if (isDeleting) return

    setDeleteDialogOpen(false)
  }

  const handleDeleteConfirm = async () => {
    if (!id) return

    try {
      // Call the store action to delete the ticket
      // Note: deleteTicket() reliably clears isDeleting to false on both success and error paths
      // This ensures dialog controls are re-enabled after the operation completes
      await deleteTicket(id)

      // Show success message
      toast.success(t('admin.ticketDetailPage.deleteSuccess'))

      // Navigate back to tickets list
      navigate(ROUTES.SUPPORT_TICKETS)
    } catch (err) {
      console.error('Failed to delete ticket:', err)
      toast.error(t('admin.ticketDetailPage.deleteError'))
      // Keep dialog open on error so user can retry or cancel
      // isDeleting is guaranteed to be false here, so dialog controls are re-enabled
    }
  }

  /**
   * Handle copying ticket ID to clipboard with proper error handling
   * Addresses potential errors from navigator.clipboard.writeText:
   * - Unsupported browser/context
   * - Insecure context (non-HTTPS)
   * - Permission denied
   */
  const handleCopyTicketId = async (ticketId: string) => {
    try {
      await navigator.clipboard.writeText(ticketId)
      toast.success(t('admin.ticketDetailPage.copySuccess'))
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      toast.error(t('admin.ticketDetailPage.copyError'))
    }
  }

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'info'
      case 'in_progress':
        return 'warning'
      case 'resolved':
        return 'success'
      case 'closed':
        return 'default'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  const formatStatus = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return t('admin.ticketsPage.statusOpen')
      case 'in_progress':
        return t('admin.ticketsPage.statusInProgress')
      case 'resolved':
        return t('admin.ticketsPage.statusResolved')
      case 'closed':
        return t('admin.ticketsPage.statusClosed')
      default:
        return status
    }
  }

  const formatPriority = (priority: TicketPriority) => {
    switch (priority) {
      case 'low':
        return t('admin.ticketsPage.priorityLow')
      case 'medium':
        return t('admin.ticketsPage.priorityMedium')
      case 'high':
        return t('admin.ticketsPage.priorityHigh')
      case 'urgent':
        return t('admin.ticketsPage.priorityUrgent')
      default:
        return priority
    }
  }

  // Check if selectedTicket matches the current route parameter
  // This prevents showing stale ticket data when navigating between tickets
  const isTicketReady = selectedTicket && selectedTicket.id === id

  // Show loading state if:
  // 1. We're actively fetching, OR
  // 2. We haven't fetched yet, OR
  // 3. There's an ID mismatch (navigating from one ticket to another)
  //    - This prevents briefly showing "not found" UI when hasFetchedOnce is still true
  //      from the previous ticket but isTicketReady is false for the new ticket
  // BUT: Don't show loading if we have a fetch error - let the error UI render instead
  if (isFetchingTicket || !hasFetchedOnce || (!isTicketReady && !fetchTicketError)) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  // Only show error/not found UI after we've attempted to fetch at least once
  // This prevents briefly showing the error UI on initial render before useEffect runs
  // Also check if the ticket ID matches to avoid showing error for stale ticket data
  if (hasFetchedOnce && (fetchTicketError || !isTicketReady)) {
    const errorMessage = fetchTicketError
      ? translateErrorCode(fetchTicketError, t)
      : t('admin.ticketDetailPage.ticketNotFound')

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {errorMessage}
        </Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          {t('admin.ticketDetailPage.backToTickets')}
        </Button>
      </Container>
    )
  }

  // At this point, selectedTicket must be non-null (TypeScript type guard)
  // If we reach here, we've passed all the loading and error checks
  if (!selectedTicket) {
    // This should never happen, but TypeScript needs this check
    return null
  }

  // Use selectedTicket from store
  const ticket = selectedTicket

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 3, textTransform: 'none', color: 'text.secondary' }}
      >
        {t('admin.ticketDetailPage.backToTickets')}
      </Button>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Ticket Details */}
        <Grid item xs={12} md={8}>
          {/* Ticket Header Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48,
                    mt: 0.5
                  }}
                >
                  <TicketIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {ticket.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={formatStatus(ticket.status)}
                      color={getStatusColor(ticket.status)}
                      size="small"
                      icon={<CheckCircleIcon />}
                    />
                    <Chip
                      label={formatPriority(ticket.priority)}
                      color={getPriorityColor(ticket.priority)}
                      size="small"
                    />
                  </Stack>
                </Box>
              </Box>
              {/* Only show edit/delete menu for admin users */}
              {isAdmin && (
                <>
                  <IconButton
                    onClick={handleMenuOpen}
                    size="small"
                    aria-label={t('admin.ticketDetailPage.ticketActions')}
                    aria-controls={anchorEl ? 'ticket-actions-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={!!anchorEl}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    id="ticket-actions-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleEditTicket}>
                      <EditIcon sx={{ mr: 1, fontSize: 20 }} />
                      {t('admin.ticketDetailPage.editTicket')}
                    </MenuItem>
                    <MenuItem onClick={handleDeleteTicket} sx={{ color: 'error.main' }}>
                      <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
                      {t('admin.ticketDetailPage.deleteTicket')}
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('admin.ticketDetailPage.description')}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  color: 'text.primary',
                  lineHeight: 1.7
                }}
              >
                {ticket.description}
              </Typography>
            </Box>

            {/* Metadata */}
            <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('admin.ticketDetailPage.createdLabel')}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {ticket.created_at ? formatDate(ticket.created_at) : t('admin.ticketDetailPage.notAvailable')}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UpdateIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('admin.ticketDetailPage.lastUpdatedLabel')}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {ticket.updated_at ? formatDate(ticket.updated_at) : t('admin.ticketDetailPage.notAvailable')}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Paper>

          {/* Comments Section */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t('admin.ticketDetailPage.comments', { count: comments.length })}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Comments List */}
            <Box sx={{ mb: 3 }}>
              {comments.length === 0 ? (
                <Box
                  sx={{
                    py: 6,
                    textAlign: 'center',
                    bgcolor: 'grey.50',
                    borderRadius: 2
                  }}
                >
                  <Typography color="text.secondary">
                    {t('admin.ticketDetailPage.noComments')}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {comments.map((comment) => (
                    <Card
                      key={comment.id}
                      elevation={0}
                      sx={{
                        bgcolor: 'grey.50',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        '&:hover': {
                          borderColor: 'primary.light',
                          bgcolor: 'grey.100'
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {t('admin.ticketDetailPage.user')}
                              </Typography>
                              {comment.created_at && (
                                <>
                                  <Typography variant="caption" color="text.secondary">
                                    •
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(comment.created_at)}
                                  </Typography>
                                </>
                              )}
                            </Box>
                            <Typography
                              variant="body1"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                color: 'text.primary',
                                lineHeight: 1.6
                              }}
                            >
                              {comment.content}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Add Comment */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t('admin.ticketDetailPage.addComment')}
              </Typography>

              {commentError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {translateErrorCode(commentError, t)}
                </Alert>
              )}

              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder={t('admin.ticketDetailPage.commentPlaceholder')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isSubmittingComment}
                variant="outlined"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper'
                  }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={isSubmittingComment ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  onClick={handleSubmitComment}
                  disabled={isSubmittingComment || !commentText.trim()}
                  sx={{
                    textTransform: 'none',
                    px: 4,
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmittingComment ? t('admin.ticketDetailPage.submitting') : t('admin.ticketDetailPage.submitComment')}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Ticket Info Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              position: 'sticky',
              top: 24
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {t('admin.ticketDetailPage.ticketInformation')}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={3}>
              {/* Status */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {t('admin.ticketDetailPage.status')}
                </Typography>
                <Chip
                  label={formatStatus(ticket.status)}
                  color={getStatusColor(ticket.status)}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              {/* Priority */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {t('admin.ticketDetailPage.priority')}
                </Typography>
                <Chip
                  label={formatPriority(ticket.priority)}
                  color={getPriorityColor(ticket.priority)}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              {/* Ticket ID */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {t('admin.ticketDetailPage.ticketId')}
                </Typography>
                <Tooltip title={t('admin.ticketDetailPage.clickToCopy')}>
                  <ButtonBase
                    onClick={() => handleCopyTicketId(ticket.id)}
                    aria-label={t('admin.ticketDetailPage.clickToCopy')}
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      fontWeight: 'medium',
                      cursor: 'pointer',
                      borderRadius: 1,
                      padding: '4px 8px',
                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: 'action.hover'
                      },
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '2px'
                      }
                    }}
                  >
                    {ticket.id.substring(0, 8)}...
                  </ButtonBase>
                </Tooltip>
              </Box>

              {/* Reporter */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {t('admin.ticketDetailPage.reporter')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                    <PersonIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                  <Typography variant="body2" fontWeight="medium">
                    {t('admin.ticketDetailPage.user')}
                  </Typography>
                </Box>
              </Box>

              {/* Assignee */}
              {ticket.assignee && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    {t('admin.ticketDetailPage.assignee')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                      <PersonIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {t('admin.ticketDetailPage.supportAgent')}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-ticket-dialog-title"
        aria-describedby="delete-ticket-dialog-description"
      >
        <DialogTitle id="delete-ticket-dialog-title">
          {t('admin.ticketDetailPage.deleteTicket')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-ticket-dialog-description">
            <Trans
              i18nKey="admin.ticketDetailPage.deleteTicketConfirm"
              values={{ ticketTitle: escapeHtml(ticket.title) }}
              components={{ strong: <strong /> }}
            />
          </DialogContentText>
          <DialogContentText sx={{ mt: 1, color: 'error.main' }}>
            {t('admin.ticketDetailPage.deleteTicketWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary" disabled={isDeleting} autoFocus>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? t('admin.ticketDetailPage.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Ticket Drawer */}
      <Drawer
        anchor="right"
        open={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 500, md: 600 },
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
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.ticketDetailPage.editTicket')}
            </Typography>
            <IconButton
              onClick={handleCloseEditDrawer}
              disabled={isUpdating}
              sx={{ color: 'white' }}
              aria-label="Close edit ticket drawer"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            <form id="edit-ticket-form" onSubmit={editForm.onSubmit(handleEditSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label={t('admin.createTicketPage.titleLabel')}
                  placeholder={t('admin.createTicketPage.titlePlaceholder')}
                  required
                  fullWidth
                  disabled={isUpdating}
                  {...editForm.getInputProps('title')}
                  error={!!editForm.errors.title}
                  helperText={editForm.errors.title}
                />

                <TextField
                  label={t('admin.createTicketPage.descriptionLabel')}
                  placeholder={t('admin.createTicketPage.descriptionPlaceholder')}
                  required
                  fullWidth
                  multiline
                  rows={6}
                  disabled={isUpdating}
                  {...editForm.getInputProps('description')}
                  error={!!editForm.errors.description}
                  helperText={editForm.errors.description}
                />

                <FormControl fullWidth required disabled={isUpdating}>
                  <InputLabel id="edit-priority-label">{t('admin.createTicketPage.priorityLabel')}</InputLabel>
                  <Select
                    labelId="edit-priority-label"
                    id="edit-priority-select"
                    label={t('admin.createTicketPage.priorityLabel')}
                    value={editForm.values.priority}
                    onChange={(e) => editForm.setFieldValue('priority', e.target.value as TicketPriority)}
                  >
                    <MenuItem value="low">{t('admin.ticketsPage.priorityLow')}</MenuItem>
                    <MenuItem value="medium">{t('admin.ticketsPage.priorityMedium')}</MenuItem>
                    <MenuItem value="high">{t('admin.ticketsPage.priorityHigh')}</MenuItem>
                    <MenuItem value="urgent">{t('admin.ticketsPage.priorityUrgent')}</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth required disabled={isUpdating}>
                  <InputLabel id="edit-status-label">{t('admin.createTicketPage.statusLabel')}</InputLabel>
                  <Select
                    labelId="edit-status-label"
                    id="edit-status-select"
                    label={t('admin.createTicketPage.statusLabel')}
                    value={editForm.values.status}
                    onChange={(e) => editForm.setFieldValue('status', e.target.value as TicketStatus)}
                  >
                    <MenuItem value="open">{t('admin.ticketsPage.statusOpen')}</MenuItem>
                    <MenuItem value="in_progress">{t('admin.ticketsPage.statusInProgress')}</MenuItem>
                    <MenuItem value="resolved">{t('admin.ticketsPage.statusResolved')}</MenuItem>
                    <MenuItem value="closed">{t('admin.ticketsPage.statusClosed')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </form>
          </Box>

          {/* Footer Actions */}
          <Divider />
          <Box
            sx={{
              p: 2,
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="outlined"
              onClick={handleCloseEditDrawer}
              disabled={isUpdating}
            >
              {t('admin.createTicketPage.cancel')}
            </Button>
            <Button
              type="submit"
              form="edit-ticket-form"
              variant="contained"
              startIcon={<SendIcon />}
              disabled={isUpdating}
            >
              {isUpdating ? t('admin.ticketDetailPage.saving') : t('admin.ticketDetailPage.saveChanges')}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  )
}

export default TicketDetailPage
