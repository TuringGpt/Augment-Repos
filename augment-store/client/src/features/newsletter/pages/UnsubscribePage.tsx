import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import { Email as EmailIcon, Unsubscribe as UnsubscribeIcon } from '@mui/icons-material'
import { useNewsletterStore } from '@store/newsletterStore'
import { useTranslation } from '@hooks/useTranslation'

/**
 * Email validation helper
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const UnsubscribePage = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [validationError, setValidationError] = useState('')

  const {
    unsubscribeByEmailPatch,
    isUnsubscribing,
    unsubscribeError,
    unsubscribeSuccess,
    clearUnsubscribeState,
  } = useNewsletterStore()

  // Clear state when component unmounts
  useEffect(() => {
    return () => {
      clearUnsubscribeState()
    }
  }, [clearUnsubscribeState])

  // Clear validation error when email changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (validationError) {
      setValidationError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear any previous validation error
    setValidationError('')

    // Validate email
    if (!email.trim()) {
      setValidationError(t('checkout.contactForm.errors.emailRequired'))
      return
    }

    if (!isValidEmail(email)) {
      setValidationError(t('checkout.contactForm.errors.emailInvalid'))
      return
    }

    try {
      // Unsubscribe from newsletter via store using PATCH method
      await unsubscribeByEmailPatch({ email })
    } catch (err) {
      // Error is handled by the store
    }
  }

  // Map error to user-friendly translated message
  const getErrorMessage = (error: string | null): string => {
    if (!error) return ''

    // If error is our error key, translate it
    if (error === 'NEWSLETTER_UNSUBSCRIBE_ERROR') {
      return t('newsletter.errors.unsubscribeFailed')
    }

    // If error contains backend validation messages, display them
    // (parseApiError already extracts user-friendly messages from backend)
    return error
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <UnsubscribeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Unsubscribe from Newsletter
          </Typography>
        </Box>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Enter your email address to unsubscribe from our newsletter. We're sorry to see you go!
        </Typography>

        {/* Success Message */}
        {unsubscribeSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Successfully unsubscribed! You will no longer receive our newsletter.
          </Alert>
        )}

        {/* Error Message */}
        {unsubscribeError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {getErrorMessage(unsubscribeError)}
          </Alert>
        )}

        {/* Validation Error */}
        {validationError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {validationError}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            size="medium"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            disabled={isUnsubscribing || unsubscribeSuccess}
            error={!!(unsubscribeError || validationError)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isUnsubscribing || unsubscribeSuccess}
            startIcon={isUnsubscribing ? <CircularProgress size={20} /> : <UnsubscribeIcon />}
          >
            {isUnsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
          </Button>
        </form>
      </Paper>
    </Container>
  )
}

export default UnsubscribePage

