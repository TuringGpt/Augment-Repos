import { useState, useEffect, useRef, useMemo } from 'react'
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
import type { TicketStatus, TicketPriority } from '@features/support/types'
import { ROUTES } from '@constants/index'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useTicketStore } from '@store/ticketStore'

type CreateTicketFormValues = {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
}

const CreateTicketPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, hasHydrated, isLoading, isAuthenticated } = useAuthStore()
  const { createTicket, isCreating, createError } = useTicketStore()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const redirectTimeoutRef = useRef<number | null>(null)

  // Cleanup timeout on unmount to prevent navigation after component is unmounted
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current != null) {
        clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
    }
  }, [])

  // Validation schema with translations - memoized to update when language changes
  const createTicketSchema = useMemo(
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

  const form = useForm<CreateTicketFormValues>({
    initialValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'open',
    },
    // Use a validation function that references the memoized schema
    // This ensures validation messages always match the active locale
    validate: (values) => zodResolver(createTicketSchema)(values),
  })

  const handleSubmit = async (values: CreateTicketFormValues) => {
    // Clear any existing timeout at the start to prevent stale redirects
    if (redirectTimeoutRef.current != null) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }

    setSuccessMessage(null)

    // Wait for hydration to complete before checking authentication
    // This prevents incorrectly treating authenticated users as unauthenticated
    // during the initial hydration or transient loading states
    if (!hasHydrated || isLoading) {
      // The store will handle the error state
      return
    }

    // Ensure user is authenticated before creating ticket
    if (!isAuthenticated || !user?.id) {
      // Redirect to login page after showing the error message
      redirectTimeoutRef.current = setTimeout(() => {
        navigate(ROUTES.LOGIN)
      }, 2000)
      return
    }

    try {
      const ticket = await createTicket({
        title: values.title,
        description: values.description,
        priority: values.priority as TicketPriority,
        status: values.status as TicketStatus,
        assignee: user.id, // Required by backend - Ticket.assignee is a non-null ForeignKey
      })

      setSuccessMessage(t('admin.createTicketPage.successMessage'))

      // Redirect to ticket detail page after 1.5 seconds
      redirectTimeoutRef.current = setTimeout(() => {
        navigate(ROUTES.SUPPORT_TICKET_DETAIL.replace(':id', ticket.id))
      }, 1500)
    } catch (err) {
      console.error('Failed to create ticket:', err)
      // Error is already handled by the store
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
        {createError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {createError}
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
              disabled={isCreating}
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
              disabled={isCreating}
            />

            {/* Priority */}
            <FormControl fullWidth required disabled={isCreating}>
              <InputLabel>{t('admin.createTicketPage.priorityLabel')}</InputLabel>
              <Select label={t('admin.createTicketPage.priorityLabel')} {...form.getInputProps('priority')}>
                <MenuItem value="low">{t('admin.createTicketPage.priorityLow')}</MenuItem>
                <MenuItem value="medium">{t('admin.createTicketPage.priorityMedium')}</MenuItem>
                <MenuItem value="high">{t('admin.createTicketPage.priorityHigh')}</MenuItem>
                <MenuItem value="urgent">{t('admin.createTicketPage.priorityUrgent')}</MenuItem>
              </Select>
            </FormControl>

            {/* Status */}
            <FormControl fullWidth required disabled={isCreating}>
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
                disabled={isCreating}
                sx={{ textTransform: 'none', px: 4 }}
              >
                {t('admin.createTicketPage.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isCreating}
                startIcon={isCreating ? <CircularProgress size={20} /> : <Send />}
                sx={{ textTransform: 'none', px: 4 }}
              >
                {isCreating ? t('admin.createTicketPage.creating') : t('admin.createTicketPage.createTicket')}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  )
}

export default CreateTicketPage
