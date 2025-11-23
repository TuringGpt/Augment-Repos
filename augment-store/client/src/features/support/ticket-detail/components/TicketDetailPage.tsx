import { useState, useEffect } from 'react'
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
import { ticketService } from '@services/api'
import type { Ticket, Comment, TicketStatus, TicketPriority } from '@features/support/types'
import { formatDate } from '@utils/formatters'
import { ROUTES } from '@constants/index'

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchTicketDetails()
      fetchComments()
    }
  }, [id])

  const fetchTicketDetails = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const data = await ticketService.getTicketById(id)
      setTicket(data)
    } catch (err) {
      console.error('Failed to load ticket:', err)
      setError('Failed to load ticket details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    if (!id) return

    try {
      const response = await ticketService.getComments(id)
      setComments(response.results)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }

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
      setCommentError('Failed to submit comment. Please try again.')
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
    return status.replace('_', ' ').toUpperCase()
  }

  const formatPriority = (priority: TicketPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  if (error || !ticket) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Ticket not found'}</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back to Tickets
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          Back to Tickets
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
          <Typography variant="body2" color="text.secondary">
            Created {formatDate(ticket.created_at)}
          </Typography>
        </Box>
      </Box>

      {/* Ticket Details */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Description
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
          {ticket.description}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Chip label={formatStatus(ticket.status)} color={getStatusColor(ticket.status)} />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Priority
            </Typography>
            <Chip
              label={formatPriority(ticket.priority)}
              color={getPriorityColor(ticket.priority)}
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Last Updated
            </Typography>
            <Typography variant="body1">{formatDate(ticket.updated_at)}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Comments Section */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Comments ({comments.length})
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Comments List */}
        <Box sx={{ mb: 3 }}>
          {comments.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No comments yet. Be the first to comment!
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
                      User
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comment.created_at)}
                    </Typography>
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
            Add a Comment
          </Typography>

          {commentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {commentError}
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Write your comment here..."
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
              {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default TicketDetailPage
