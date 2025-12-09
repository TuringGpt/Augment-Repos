import { useState, useEffect } from 'react'
import { Box, Container, Typography, Link, Grid, TextField, Button, Alert, InputAdornment } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { Email as EmailIcon } from '@mui/icons-material'
import { getBrandColors } from '@config/theme'
import { useThemeStore } from '@store/themeStore'
import { useNewsletterStore } from '@store/newsletterStore'
import { useTranslation } from '@hooks/useTranslation'
import { isValidEmail } from '@utils/validators'

const Footer = () => {
  const { t } = useTranslation()
  const mode = useThemeStore((state) => state.mode)
  const brandColors = getBrandColors(mode)
  const [email, setEmail] = useState('')

  const {
    subscribe,
    isSubscribing,
    subscribeError,
    subscribeSuccess,
    clearSubscribeState
  } = useNewsletterStore()

  // Clear subscribe state when email changes
  useEffect(() => {
    if (subscribeError || subscribeSuccess) {
      clearSubscribeState()
    }
  }, [email, subscribeError, subscribeSuccess, clearSubscribeState])

  // Clear email and subscribe state after successful subscription
  useEffect(() => {
    if (subscribeSuccess) {
      setEmail('')
      // Clear success message after 3 seconds
      const timer = setTimeout(() => {
        clearSubscribeState()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [subscribeSuccess, clearSubscribeState])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!email.trim()) {
      return
    }

    if (!isValidEmail(email)) {
      return
    }

    try {
      // Subscribe to newsletter via store
      await subscribe({ email })
    } catch (err) {
      // Error is handled by the store
    }
  }

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: brandColors.footer.background,
        color: brandColors.footer.text,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              {t('common.appName')}
            </Typography>
            <Typography variant="body2" color={brandColors.footer.textSecondary}>
              {t('footer.tagline')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              {t('footer.quickLinks')}
            </Typography>
            <Link component={RouterLink} to="/products" color="inherit" display="block">
              {t('nav.products')}
            </Link>
            <Link component={RouterLink} to="/about" color="inherit" display="block">
              {t('footer.aboutUs')}
            </Link>
            <Link component={RouterLink} to="/contact" color="inherit" display="block">
              {t('footer.contactUs')}
            </Link>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              {t('footer.customerService')}
            </Typography>
            <Link component={RouterLink} to="/help" color="inherit" display="block">
              {t('footer.helpCenter')}
            </Link>
            <Link component={RouterLink} to="/returns" color="inherit" display="block">
              {t('footer.returns')}
            </Link>
            <Link component={RouterLink} to="/shipping" color="inherit" display="block">
              {t('footer.shippingInfo')}
            </Link>
          </Grid>
        </Grid>

        {/* Newsletter Subscription Section */}
        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="h6" gutterBottom align="center">
            {t('footer.newsletter')}
          </Typography>
          <Typography variant="body2" color={brandColors.footer.textSecondary} align="center" sx={{ mb: 2 }}>
            {t('footer.subscribeNewsletter')}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              maxWidth: 500,
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label={t('footer.emailLabel')}
                placeholder={t('footer.enterEmail')}
                value={email}
                onChange={handleEmailChange}
                disabled={isSubscribing}
                error={!!subscribeError}
                sx={{
                  backgroundColor: 'background.paper',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: subscribeError ? 'error.main' : 'divider',
                    },
                  },
                }}
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
                disabled={isSubscribing}
                sx={{
                  minWidth: { xs: '100%', sm: 120 },
                  whiteSpace: 'nowrap',
                }}
              >
                {isSubscribing ? t('common.loading') : t('footer.subscribe')}
              </Button>
            </Box>

            {subscribeError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {subscribeError}
              </Alert>
            )}

            {subscribeSuccess && (
              <Alert severity="success" sx={{ mt: 1 }}>
                {t('common.success')}
              </Alert>
            )}
          </Box>
        </Box>

        <Typography variant="body2" color={brandColors.footer.textSecondary} align="center" sx={{ mt: 3 }}>
          © {new Date().getFullYear()} {t('common.appName')}. {t('footer.allRightsReserved')}.
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
