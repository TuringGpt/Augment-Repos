import { useState, useEffect, useCallback } from 'react'
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
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  ConfirmationNumber as TicketIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import type { TFunction } from 'i18next'
import { ticketService } from '@services/api'
import type { Comment, TicketStatus, TicketPriority } from '@features/support/types'
import { formatDate } from '@utils/formatters'
import { ROUTES } from '@constants/index'
import { useTranslation } from '@hooks/useTranslation'
import { useTicketStore } from '@store/ticketStore'

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
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Use ticket store for fetching ticket details
  const {
    selectedTicket,
    isFetchingTicket,
    fetchTicketError,
    getTicketById,
    clearSelectedTicket
  } = useTicketStore()

  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  // Track if we've attempted to fetch the ticket at least once
  // This prevents showing "not found" error on initial render before useEffect runs
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)

  const fetchTicketDetails = useCallback(async () => {
    if (!id) return

    try {
      await getTicketById(id)
    } catch (err) {
      // Error is already logged and handled by the store
    } finally {
      setHasFetchedOnce(true)
    }
  }, [id, getTicketById])

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
    if (id) {
      fetchTicketDetails()
      fetchComments()
    }

    // Cleanup: clear selected ticket when component unmounts
    return () => {
      clearSelectedTicket()
      setHasFetchedOnce(false)
    }
  }, [id, fetchTicketDetails, fetchComments, clearSelectedTicket])

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

  // Show loading state if we're fetching OR if we haven't fetched yet and don't have a ticket
  if (isFetchingTicket || (!hasFetchedOnce && !selectedTicket)) {
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
  if (hasFetchedOnce && (fetchTicketError || !selectedTicket)) {
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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          {t('admin.ticketDetailPage.backToTickets')}
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TicketIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            {ticket.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip label={formatStatus(ticket.status)} color={getStatusColor(ticket.status)} />
          <Chip label={formatPriority(ticket.priority)} color={getPriorityColor(ticket.priority)} />
          {ticket.created_at && (
            <Typography variant="body2" color="text.secondary">
              {t('admin.ticketDetailPage.created', { date: formatDate(ticket.created_at) })}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Ticket Details */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('admin.ticketDetailPage.description')}
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
          {ticket.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('admin.ticketDetailPage.status')}
            </Typography>
            <Chip label={formatStatus(ticket.status)} color={getStatusColor(ticket.status)} />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('admin.ticketDetailPage.priority')}
            </Typography>
            <Chip
              label={formatPriority(ticket.priority)}
              color={getPriorityColor(ticket.priority)}
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('admin.ticketDetailPage.lastUpdated')}
            </Typography>
            <Typography variant="body1">
              {ticket.updated_at ? formatDate(ticket.updated_at) : t('admin.ticketDetailPage.notAvailable')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Comments Section */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t('admin.ticketDetailPage.comments', { count: comments.length })}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Comments List */}
        <Box sx={{ mb: 3 }}>
          {comments.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              {t('admin.ticketDetailPage.noComments')}
            </Typography>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id} sx={{ mb: 2, backgroundColor: 'grey.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      <PersonIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {t('admin.ticketDetailPage.user')}
                    </Typography>
                    {comment.created_at && (
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(comment.created_at)}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', ml: 5 }}>
                    {comment.content}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>

        {/* Add Comment */}
        <Box>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
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
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={isSubmittingComment ? <CircularProgress size={20} /> : <SendIcon />}
              onClick={handleSubmitComment}
              disabled={isSubmittingComment || !commentText.trim()}
              sx={{ textTransform: 'none', px: 4 }}
            >
              {isSubmittingComment ? t('admin.ticketDetailPage.submitting') : t('admin.ticketDetailPage.submitComment')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default TicketDetailPage
