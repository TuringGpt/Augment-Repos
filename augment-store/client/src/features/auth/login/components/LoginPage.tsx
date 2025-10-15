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
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Colors } from '@config/colors'
import { authService } from '@services/api/auth/authService'
import { useAuthStore } from '@store/authStore'
import type { LoginRequest } from '@features/auth/types'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login: setAuthState, setLoading, setError } = useAuthStore()

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginRequest>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginRequest> = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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

    try {
      const response = await authService.login(formData)
      setAuthState(response.user, response.accessToken, response.refreshToken)
      navigate('/')
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message ||
        (error as { message?: string }).message ||
        'Login failed. Please try again.'
      setApiError(errorMessage)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
      setLoading(false)
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
            }}
          >
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Sign in to continue to Augment Store
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

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color={errors.email ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color={errors.password ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
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
                    color: Colors.primary.main,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Forgot Password?
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
                  background: Colors.gradient.purpleViolet,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  '&:hover': {
                    background: Colors.gradient.blueIndigo,
                  },
                }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </form>

            {/* Sign Up Link */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: Colors.primary.main,
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign Up
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
