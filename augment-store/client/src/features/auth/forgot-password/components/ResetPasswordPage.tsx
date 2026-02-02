import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Fade,
  Slide,
} from '@mui/material'
import { Visibility, VisibilityOff, Lock, CheckCircle } from '@mui/icons-material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Colors } from '@config/colors'
import { authService } from '@services/api/auth/authService'
import type { ResetPasswordRequest } from '@features/auth/types'
import { parseApiError } from '@utils/errorUtils'
import { useTranslation } from '@hooks/useTranslation'
import LanguageSwitcher from '@components/LanguageSwitcher'

interface ResetPasswordFormData {
  newPassword: string
  confirmPassword: string
}

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { t } = useTranslation()

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<ResetPasswordFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setApiError(t('auth.resetPasswordPage.invalidToken'))
    }
  }, [token, t])

  // Cleanup timeout on unmount to prevent navigation after component unmounts
  useEffect(() => {
    if (successMessage) {
      const timeoutId = setTimeout(() => {
        navigate('/login')
      }, 2000)

      return () => clearTimeout(timeoutId)
    }
  }, [successMessage, navigate])

  const validateForm = (): boolean => {
    const newErrors: Partial<ResetPasswordFormData> = {}

    // Password validation
    if (!formData.newPassword) {
      newErrors.newPassword = t('auth.resetPasswordPage.passwordRequired')
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('auth.resetPasswordPage.passwordTooShort')
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = t('auth.resetPasswordPage.passwordComplexity')
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.resetPasswordPage.confirmPasswordRequired')
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.resetPasswordPage.passwordMismatch')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange =
    (field: keyof ResetPasswordFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!token) {
      setApiError(t('auth.resetPasswordPage.invalidToken'))
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setApiError(null)
    setSuccessMessage(null)

    try {
      const resetData: ResetPasswordRequest = {
        token,
        newPassword: formData.newPassword,
      }
      await authService.resetPassword(resetData)
      setSuccessMessage(t('auth.resetPasswordPage.successMessage'))
      // Redirect handled by useEffect with cleanup
    } catch (error) {
      const errorMessage = parseApiError(error, {
        fieldNames: ['password', 'confirm_password'],
        defaultMessage: t('auth.resetPasswordPage.errorMessage'),
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
        background: Colors.gradient.blueIndigo,
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
              background: Colors.gradient.blueIndigo,
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
              {t('auth.resetPasswordPage.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('auth.resetPasswordPage.subtitle')}
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
                <Alert
                  severity="success"
                  sx={{ mb: 3 }}
                  icon={<CheckCircle />}
                  onClose={() => setSuccessMessage(null)}
                >
                  {successMessage}
                </Alert>
              </Fade>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                size="small"
                label={t('auth.resetPasswordPage.newPasswordLabel')}
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange('newPassword')}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
                disabled={isSubmitting || !token}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" color={errors.newPassword ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        disabled={isSubmitting || !token}
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
              />

              <TextField
                fullWidth
                size="small"
                label={t('auth.resetPasswordPage.confirmPasswordLabel')}
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={isSubmitting || !token}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" color={errors.confirmPassword ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                        disabled={isSubmitting || !token}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting || !token}
                sx={{
                  py: 1.5,
                  background: Colors.gradient.blueIndigo,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  '&:hover': {
                    background: Colors.gradient.purpleViolet,
                  },
                }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('auth.resetPasswordPage.resetButton')}
              </Button>
            </form>

            {/* Password Requirements */}
            <Box sx={{ mt: 3, p: 2, bgcolor: Colors.background.paper, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" component="div">
                Password must contain:
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                • At least 8 characters
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                • One uppercase letter
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                • One lowercase letter
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                • One number
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </Box>
  )
}

export default ResetPasswordPage
