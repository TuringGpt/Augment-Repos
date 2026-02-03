import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Fade,
  Slide,
  Button,
  Link,
} from '@mui/material'
import { Email, CheckCircle, ArrowBack } from '@mui/icons-material'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { authService } from '@services/api/auth/authService'
import { parseApiError } from '@utils/errorUtils'
import { useTranslation } from '@hooks/useTranslation'
import LanguageSwitcher from '@components/LanguageSwitcher'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const { t } = useTranslation()
  const [isVerifying, setIsVerifying] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Auto-verify if token is present in URL
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      handleVerifyEmail(token)
    }
  }, [searchParams])

  const handleVerifyEmail = async (token: string) => {
    setIsVerifying(true)
    setApiError(null)
    setSuccessMessage(null)

    try {
      await authService.verifyEmail(token)
      setSuccessMessage(t('auth.verifyEmailPage.successMessage'))
    } catch (error) {
      const errorMessage = parseApiError(error, {
        defaultMessage: t('auth.verifyEmailPage.errorMessage'),
      })
      setApiError(errorMessage)
    } finally {
      setIsVerifying(false)
    }
  }

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

            <Email sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t('auth.verifyEmailPage.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {email
                ? t('auth.verifyEmailPage.subtitle', { email })
                : t('auth.verifyEmailPage.subtitleNoEmail')}
            </Typography>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: 4 }}>
            {/* Success Message */}
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

            {/* Error Message */}
            {apiError && (
              <Fade in={true}>
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setApiError(null)}>
                  {apiError}
                </Alert>
              </Fade>
            )}

            {/* Verifying State */}
            {isVerifying && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  {t('auth.verifyEmailPage.verifying')}
                </Typography>
              </Box>
            )}

            {/* Default State - Waiting for verification */}
            {!isVerifying && !successMessage && !apiError && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircle sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {t('auth.verifyEmailPage.waitingTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('auth.verifyEmailPage.instructions')}
                </Typography>

                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('auth.verifyEmailPage.notReceived')}</strong>
                    <br />
                    {t('auth.verifyEmailPage.notReceivedHelp')}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Success State - Show login button */}
            {successMessage && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  size="large"
                  fullWidth
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
                  {t('auth.verifyEmailPage.backToLogin')}
                </Button>
              </Box>
            )}

            {/* Back to Login Link */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: 'primary.main',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <ArrowBack fontSize="small" />
                {t('auth.verifyEmailPage.backToLogin')}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </Box>
  )
}

export default VerifyEmailPage
