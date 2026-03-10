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
import { parseApiError } from '@utils/errorUtils'
import { useTranslation } from '@hooks/useTranslation'

type CreateTicketFormValues = {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
}

const CreateTicketPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Validation schema with translations
  const createTicketSchema = z.object({
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
  })

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

      setSuccessMessage(t('admin.createTicketPage.successMessage'))

      // Redirect to ticket detail page after 1.5 seconds
      setTimeout(() => {
        navigate(ROUTES.SUPPORT_TICKET_DETAIL.replace(':id', ticket.id))
      }, 1500)
    } catch (err) {
      console.error('Failed to create ticket:', err)

      const errorMessage = parseApiError(err, {
        fieldNames: ['title', 'description', 'priority', 'status'],
        defaultMessage: t('admin.createTicketPage.errorMessage'),
      })

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
          {t('admin.createTicketPage.backToTickets')}
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ConfirmationNumber sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            {t('admin.createTicketPage.title')}
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {t('admin.createTicketPage.subtitle')}
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
              label={t('admin.createTicketPage.titleLabel')}
              placeholder={t('admin.createTicketPage.titlePlaceholder')}
              required
              fullWidth
              {...form.getInputProps('title')}
              error={!!form.errors.title}
              helperText={form.errors.title}
              disabled={isSubmitting}
            />

            {/* Description */}
            <TextField
              label={t('admin.createTicketPage.descriptionLabel')}
              placeholder={t('admin.createTicketPage.descriptionPlaceholder')}
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
              <InputLabel>{t('admin.createTicketPage.priorityLabel')}</InputLabel>
              <Select label={t('admin.createTicketPage.priorityLabel')} {...form.getInputProps('priority')}>
                <MenuItem value="low">{t('admin.createTicketPage.priorityLow')}</MenuItem>
                <MenuItem value="medium">{t('admin.createTicketPage.priorityMedium')}</MenuItem>
                <MenuItem value="high">{t('admin.createTicketPage.priorityHigh')}</MenuItem>
                <MenuItem value="urgent">{t('admin.createTicketPage.priorityUrgent')}</MenuItem>
              </Select>
            </FormControl>

            {/* Status */}
            <FormControl fullWidth required disabled={isSubmitting}>
              <InputLabel>{t('admin.createTicketPage.statusLabel')}</InputLabel>
              <Select label={t('admin.createTicketPage.statusLabel')} {...form.getInputProps('status')}>
                <MenuItem value="open">{t('admin.createTicketPage.statusOpen')}</MenuItem>
                <MenuItem value="in_progress">{t('admin.createTicketPage.statusInProgress')}</MenuItem>
                <MenuItem value="resolved">{t('admin.createTicketPage.statusResolved')}</MenuItem>
                <MenuItem value="closed">{t('admin.createTicketPage.statusClosed')}</MenuItem>
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
                {t('admin.createTicketPage.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                sx={{ textTransform: 'none', px: 4 }}
              >
                {isSubmitting ? t('admin.createTicketPage.creating') : t('admin.createTicketPage.createTicket')}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}

export default CreateTicketPage
