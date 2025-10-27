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
import { Colors } from '@config/colors'
import { authService } from '@services/api/auth/authService'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
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
      setSuccessMessage('Your email has been verified successfully! You can now log in.')
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message ||
        (error as { message?: string }).message ||
        'Failed to verify email. The link may be invalid or expired.'
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
            }}
          >
            <Email sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Verify Your Email
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {email ? `We've sent a verification link to ${email}` : 'Check your email for verification'}
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
                  Verifying your email...
                </Typography>
              </Box>
            )}

            {/* Default State - Waiting for verification */}
            {!isVerifying && !successMessage && !apiError && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircle sx={{ fontSize: 64, color: Colors.primary.main, mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Check Your Email
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  We've sent a verification link to your email address. Please click the link to verify
                  your account and complete the registration process.
                </Typography>

                <Box
                  sx={{
                    bgcolor: Colors.background.light,
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    <strong>Didn't receive the email?</strong>
                    <br />
                    Check your spam folder or contact support if you need assistance.
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
                    background: Colors.gradient.blueIndigo,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    '&:hover': {
                      background: Colors.gradient.purpleViolet,
                    },
                  }}
                >
                  Go to Login
                </Button>
              </Box>
            )}

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
                Back to Login
              </Link>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </Box>
  )
}

export default VerifyEmailPage

