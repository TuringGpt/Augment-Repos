import { useState } from 'react'
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import { ArrowBack, Send, ConfirmationNumber } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import { ticketService } from '@services/api'
import type { TicketStatus, TicketPriority } from '@features/support/types'
import { ROUTES } from '@constants/index'

// Validation schema
const createTicketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255, 'Title is too long'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description is too long'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
})

type CreateTicketFormValues = z.infer<typeof createTicketSchema>

const CreateTicketPage = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<CreateTicketFormValues>({
    initialValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'open',
    },
    validate: zodResolver(createTicketSchema),
  })

  const handleSubmit = async (values: CreateTicketFormValues) => {
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const ticket = await ticketService.createTicket({
        title: values.title,
        description: values.description,
        priority: values.priority as TicketPriority,
        status: values.status as TicketStatus,
      })

      setSuccessMessage('Ticket created successfully! Redirecting...')

      // Redirect to ticket detail page after 1.5 seconds
      setTimeout(() => {
        navigate(ROUTES.SUPPORT_TICKET_DETAIL.replace(':id', ticket.id))
      }, 1500)
    } catch (err) {
      console.error('Failed to create ticket:', err)
      const errorMessage =
        (err as { response?: { data?: { details?: string; message?: string } } }).response?.data
          ?.details ||
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (err as { message?: string }).message ||
        'Failed to create ticket. Please try again.'
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate(ROUTES.SUPPORT_TICKETS)
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          Back to Tickets
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ConfirmationNumber sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Create Support Ticket
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Describe your issue and we'll get back to you as soon as possible
        </Typography>
      </Box>

      {/* Form */}
      <Paper sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Title */}
            <TextField
              label="Title"
              placeholder="Brief summary of your issue"
              required
              fullWidth
              {...form.getInputProps('title')}
              error={!!form.errors.title}
              helperText={form.errors.title}
              disabled={isSubmitting}
            />

            {/* Description */}
            <TextField
              label="Description"
              placeholder="Provide detailed information about your issue..."
              required
              fullWidth
              multiline
              rows={6}
              {...form.getInputProps('description')}
              error={!!form.errors.description}
              helperText={form.errors.description}
              disabled={isSubmitting}
            />

            {/* Priority */}
            <FormControl fullWidth required disabled={isSubmitting}>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" {...form.getInputProps('priority')}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            {/* Status */}
            <FormControl fullWidth required disabled={isSubmitting}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" {...form.getInputProps('status')}>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={isSubmitting}
                sx={{ textTransform: 'none', px: 4 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                sx={{ textTransform: 'none', px: 4 }}
              >
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}

export default CreateTicketPage
