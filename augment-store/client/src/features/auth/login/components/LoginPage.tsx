import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Link,
  Alert,
  CircularProgress,
  Fade,
  Slide,
  useTheme,
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { authService } from '@services/api/auth/authService'
import { useAuthStore } from '@store/authStore'
import type { LoginRequest } from '@features/auth/types'
import { useTranslation } from '@hooks/useTranslation'
import LanguageSwitcher from '@components/LanguageSwitcher'
import { Colors } from '@config/colors'

const LoginPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { login: setAuthState, setLoading, setError } = useAuthStore()
  const { t } = useTranslation()

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginRequest>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginRequest> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = t('auth.loginPage.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('auth.loginPage.emailInvalid')
    }

    // Password validation - only check if provided, no length/strength requirements on login
    if (!formData.password) {
      newErrors.password = t('auth.loginPage.passwordRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof LoginRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    // Clear API error when user starts typing
    if (apiError) {
      setApiError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setLoading(true)
    setApiError(null)
    setSuccessMessage(null)

    try {
      const response = await authService.login(formData)

      // Show success message
      setSuccessMessage(t('auth.loginPage.loginSuccess'))

      // Set auth state and redirect after a brief delay to show success message
      setAuthState(response.user, response.accessToken, response.refreshToken)
      // Note: Keep form disabled during redirect to prevent duplicate submissions
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (error) {
      // Enhanced error handling for Django backend responses
      let errorMessage = t('auth.loginPage.loginFailed')

      const axiosError = error as {
        response?: {
          data?: {
            email?: string[]
            password?: string[]
            detail?: string
            details?: string[]
            message?: string
            non_field_errors?: string[]
          }
          status?: number
        }
        message?: string
      }

      if (axiosError.response?.data) {
        const data = axiosError.response.data

        // Handle field-specific errors from Django
        if (data.email) {
          errorMessage = Array.isArray(data.email) ? data.email[0] : data.email
        } else if (data.password) {
          errorMessage = Array.isArray(data.password) ? data.password[0] : data.password
        } else if (data.details) {
          // Handle serializer-level errors (NON_FIELD_ERRORS_KEY = "details" in Django settings)
          errorMessage = Array.isArray(data.details) ? data.details[0] : data.details
        } else if (data.non_field_errors) {
          errorMessage = data.non_field_errors[0]
        } else if (data.detail) {
          errorMessage = data.detail
        } else if (data.message) {
          errorMessage = data.message
        }
      } else if (axiosError.message) {
        errorMessage = axiosError.message
      }

      setApiError(errorMessage)
      setError(errorMessage)
      // Only reset submitting state on error to re-enable the form
      setIsSubmitting(false)
    } finally {
      setLoading(false)
    }
  }

  // Theme-derived hover background color for guest button
  const guestButtonHoverBg = Colors.hexWithAlpha(
    theme.palette.primary.main,
    theme.palette.mode === 'dark' ? 0.08 : 0.04
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
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
            bgcolor: 'background.paper',
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
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
              {t('auth.loginPage.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('auth.loginPage.subtitle')}
            </Typography>
          </Box>

          {/* Form Section */}
          <Box sx={{ p: 4 }}>
            {/* Success Banner */}
            {successMessage && (
              <Fade in={true}>
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
                  {successMessage}
                </Alert>
              </Fade>
            )}

            {/* Error Banner */}
            {apiError && (
              <Fade in={true}>
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError(null)}>
                  {apiError}
                </Alert>
              </Fade>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                size="small"
                label={t('auth.loginPage.emailLabel')}
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" color={errors.email ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                size="small"
                label={t('auth.loginPage.passwordLabel')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" color={errors.password ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        disabled={isSubmitting}
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {t('auth.loginPage.forgotPasswordLink')}
                </Link>
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('auth.loginPage.signInButton')}
              </Button>
            </form>

            {/* Continue as Guest Button */}
            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: guestButtonHoverBg,
                  },
                }}
              >
                {t('auth.loginPage.continueAsGuest')}
              </Button>
            </Box>

            {/* Sign Up Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('auth.loginPage.noAccount')}{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {t('auth.loginPage.signUpLink')}
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </Box>
  )
}

export default LoginPage
