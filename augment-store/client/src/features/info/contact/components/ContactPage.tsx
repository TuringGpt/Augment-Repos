import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  InputAdornment,
  Fade,
  Slide,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import {
  Email,
  Phone,
  LocationOn,
  Person,
  Subject as SubjectIcon,
  Message as MessageIcon,
  Send,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { CONTACT_INFO } from '@constants/index'
import { useContactStore } from '@store/contactStore'

interface FormData {
  name: string
  email: string
  subject: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const ContactPage = () => {
  const { t } = useTranslation()
  const theme = useTheme()

  // Contact store
  const { submitContact, isSubmitting, error: storeError, lastSubmittedContact, clearError } = useContactStore()

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Clear store error when component unmounts
  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    // Clear store error when user starts typing
    if (storeError) {
      clearError()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Submit contact form via store
      await submitContact({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      })

      // Clear form on success
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      // Error is handled by the store
      console.error('Failed to submit contact form:', err)
    }
  }

  const contactMethods = [
    {
      icon: Email,
      title: t('contact.email'),
      value: CONTACT_INFO.SUPPORT_EMAIL,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
    },
    {
      icon: Phone,
      title: t('contact.phone'),
      value: CONTACT_INFO.SUPPORT_PHONE,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
    },
    {
      icon: LocationOn,
      title: t('contact.address'),
      value: '123 Commerce Street\nSan Francisco, CA 94102\nUnited States',
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1),
    },
  ]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.1)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha('#ffffff', 0.95)} 100%)`,
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Fade in={true} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              {t('contact.title')}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}
            >
              {t('contact.description')}
            </Typography>
          </Box>
        </Fade>

        <Grid container spacing={4}>
          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <Slide direction="right" in={true} timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  boxShadow: theme.shadows[8],
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paper, 0.8)
                      : theme.palette.background.paper,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                  {t('contact.getInTouch')}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {lastSubmittedContact && (
                  <Fade in={!!lastSubmittedContact}>
                    <Alert
                      severity="success"
                      icon={<CheckCircle />}
                      sx={{ mb: 3, borderRadius: 2 }}
                    >
                      Thank you for contacting us! We'll get back to you soon.
                    </Alert>
                  </Fade>
                )}

                {storeError && (
                  <Fade in={!!storeError}>
                    <Alert
                      severity="error"
                      sx={{ mb: 3, borderRadius: 2 }}
                      onClose={() => clearError()}
                    >
                      {storeError}
                    </Alert>
                  </Fade>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label={t('contact.name')}
                    value={formData.name}
                    onChange={handleChange('name')}
                    error={!!errors.name}
                    helperText={errors.name}
                    disabled={isSubmitting}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color={errors.name ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label={t('contact.email')}
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
                          <Email color={errors.email ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label={t('contact.subject')}
                    value={formData.subject}
                    onChange={handleChange('subject')}
                    error={!!errors.subject}
                    helperText={errors.subject}
                    disabled={isSubmitting}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SubjectIcon color={errors.subject ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label={t('contact.message')}
                    multiline
                    rows={5}
                    value={formData.message}
                    onChange={handleChange('message')}
                    error={!!errors.message}
                    helperText={errors.message}
                    disabled={isSubmitting}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                          <MessageIcon color={errors.message ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={isSubmitting}
                    endIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      boxShadow: theme.shadows[4],
                      '&:hover': {
                        boxShadow: theme.shadows[8],
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isSubmitting ? 'Sending...' : t('contact.sendMessage')}
                  </Button>
                </Box>
              </Paper>
            </Slide>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={5}>
            <Slide direction="left" in={true} timeout={600}>
              <Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    boxShadow: theme.shadows[8],
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.8)
                        : theme.palette.background.paper,
                    backdropFilter: 'blur(10px)',
                    mb: 3,
                  }}
                >
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                    {t('contact.contactInformation')}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {contactMethods.map((method, index) => (
                      <Fade in={true} timeout={800 + index * 200} key={index}>
                        <Card
                          elevation={0}
                          sx={{
                            border: `1px solid ${alpha(method.color, 0.2)}`,
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateX(8px)',
                              boxShadow: `0 4px 20px ${alpha(method.color, 0.15)}`,
                              borderColor: method.color,
                            },
                          }}
                        >
                          <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: method.bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <method.icon sx={{ color: method.color, fontSize: 28 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}
                              >
                                {method.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  whiteSpace: 'pre-line',
                                  color: 'text.primary',
                                }}
                              >
                                {method.value}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Fade>
                    ))}
                  </Box>
                </Paper>

                {/* Business Hours */}
                <Fade in={true} timeout={1400}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      boxShadow: theme.shadows[8],
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      background:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.8)
                          : theme.palette.background.paper,
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          display: 'flex',
                        }}
                      >
                        <AccessTime sx={{ color: theme.palette.warning.main, fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {t('contact.businessHours')}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t('contact.mondayFriday')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t('contact.saturday')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t('contact.sunday')}
                      </Typography>
                    </Box>
                  </Paper>
                </Fade>
              </Box>
            </Slide>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default ContactPage
