import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  Link,
  Alert,
  CircularProgress,
  Fade,
  Slide,
} from '@mui/material'
import { Email, ArrowBack } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { Colors } from '@config/colors'
import { authService } from '@services/api/auth/authService'
import type { ForgotPasswordRequest } from '@features/auth/types'
import { parseApiError } from '@utils/errorUtils'
import { useTranslation } from '@hooks/useTranslation'
import LanguageSwitcher from '@components/LanguageSwitcher'

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<ForgotPasswordRequest>({
    email: '',
  })
  const [errors, setErrors] = useState<Partial<ForgotPasswordRequest>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Partial<ForgotPasswordRequest> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = t('auth.forgotPasswordPage.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.forgotPasswordPage.emailInvalid')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange =
    (field: keyof ForgotPasswordRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
      // Clear messages when user starts typing
      if (apiError) {
        setApiError(null)
      }
      if (successMessage) {
        setSuccessMessage(null)
      }
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setApiError(null)
    setSuccessMessage(null)

    try {
      await authService.forgotPassword(formData)
      setSuccessMessage(t('auth.forgotPasswordPage.successMessage'))
      // Clear the form
      setFormData({ email: '' })
    } catch (error) {
      const errorMessage = parseApiError(error, {
        fieldNames: ['email'],
        defaultMessage: t('auth.forgotPasswordPage.errorMessage'),
      })
      setApiError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: Colors.gradient.purpleViolet,
        py: 4,
      }}
    >
      <Slide direction="up" in={true} timeout={500}>
        <Paper
          elevation={24}
          sx={{
            maxWidth: 480,
            width: '100%',
            mx: 2,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              background: Colors.gradient.purpleViolet,
              color: Colors.text.white,
              p: 4,
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Language Switcher */}
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <LanguageSwitcher />
            </Box>

            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t('auth.forgotPasswordPage.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('auth.forgotPasswordPage.subtitle')}
            </Typography>
          </Box>

          {/* Form Section */}
          <Box sx={{ p: 4 }}>
            {apiError && (
              <Fade in={true}>
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError(null)}>
                  {apiError}
                </Alert>
              </Fade>
            )}

            {successMessage && (
              <Fade in={true}>
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
                  {successMessage}
                </Alert>
              </Fade>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                size="small"
                label={t('auth.forgotPasswordPage.emailLabel')}
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isSubmitting}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" color={errors.email ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  background: Colors.gradient.purpleViolet,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  '&:hover': {
                    background: Colors.gradient.blueIndigo,
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('auth.forgotPasswordPage.sendButton')
                )}
              </Button>
            </form>

            {/* Back to Login Link */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: Colors.primary.main,
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <ArrowBack fontSize="small" />
                {t('auth.forgotPasswordPage.backToLogin')}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </Box>
  )
}

export default ForgotPasswordPage
