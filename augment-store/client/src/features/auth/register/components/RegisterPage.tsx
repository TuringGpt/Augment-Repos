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
  Grid,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Colors } from '@config/colors'
import { authService } from '@services/api/auth/authService'
import { useAuthStore } from '@store/authStore'
import type { RegisterRequest } from '@features/auth/types'

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string
  agreeToTerms: boolean
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login: setAuthState, setLoading, setError } = useAuthStore()

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {}

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange =
    (field: keyof RegisterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === 'agreeToTerms' ? e.target.checked : e.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, agreeToTerms, ...registerData } = formData
      const response = await authService.register(registerData)
      setAuthState(response.user, response.accessToken, response.refreshToken)
      navigate('/')
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message ||
        (error as { message?: string }).message ||
        'Registration failed. Please try again.'
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
        background: Colors.gradient.blueIndigo,
        py: 4,
      }}
    >
      <Slide direction="up" in={true} timeout={500}>
        <Paper
          elevation={24}
          sx={{
            maxWidth: 600,
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
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Join Augment Store today
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
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color={errors.firstName ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color={errors.lastName ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
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
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
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
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color={errors.confirmPassword ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            disabled={isSubmitting}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.agreeToTerms}
                        onChange={handleChange('agreeToTerms')}
                        disabled={isSubmitting}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" color={errors.agreeToTerms ? 'error' : 'inherit'}>
                        I agree to the{' '}
                        <Link href="/terms" target="_blank" sx={{ color: Colors.primary.main }}>
                          Terms and Conditions
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" target="_blank" sx={{ color: Colors.primary.main }}>
                          Privacy Policy
                        </Link>
                      </Typography>
                    }
                  />
                  {errors.agreeToTerms && (
                    <Typography variant="caption" color="error" sx={{ ml: 4, display: 'block' }}>
                      {errors.agreeToTerms}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  mt: 3,
                  py: 1.5,
                  background: Colors.gradient.blueIndigo,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  '&:hover': {
                    background: Colors.gradient.purpleViolet,
                  },
                }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>
            </form>

            {/* Password Requirements */}
            <Box sx={{ mt: 3, p: 2, bgcolor: Colors.background.light, borderRadius: 1 }}>
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

            {/* Sign In Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: Colors.primary.main,
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </Box>
  )
}

export default RegisterPage
