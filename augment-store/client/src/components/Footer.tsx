import { useState, useEffect } from 'react'
import { Box, Container, Typography, Link, Grid, TextField, Button, Alert, InputAdornment, Divider, Stack, Select, MenuItem, FormControl, SelectChangeEvent, IconButton, Tooltip } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { Email as EmailIcon, Facebook, Twitter, Instagram, LinkedIn, Language as LanguageIcon, Brightness4, Brightness7 } from '@mui/icons-material'
import { getBrandColors } from '@config/theme'
import { useThemeStore } from '@store/themeStore'
import { useNewsletterStore } from '@store/newsletterStore'
import { useTranslation } from '@hooks/useTranslation'
import { isValidEmail } from '@utils/validators'
import { LANGUAGES, LanguageCode } from '@config/i18n'

const Footer = () => {
  const { t, i18n } = useTranslation()
  const { mode, toggleMode } = useThemeStore()
  const brandColors = getBrandColors(mode)
  const [email, setEmail] = useState('')
  const [validationError, setValidationError] = useState('')

  const {
    subscribe,
    isSubscribing,
    subscribeError,
    subscribeSuccess,
    clearSubscribeState
  } = useNewsletterStore()

  // Language change handler
  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    i18n.changeLanguage(event.target.value as LanguageCode)
  }

  // Theme toggle handler with View Transitions API
  const handleThemeToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Check if View Transitions API is supported
    if (!document.startViewTransition || prefersReducedMotion) {
      toggleMode()
      return
    }

    // Get click position for circular reveal animation
    let x = event.clientX
    let y = event.clientY

    if (x === 0 && y === 0) {
      const rect = event.currentTarget.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    }

    // Calculate the maximum radius needed to cover the entire screen
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // Start the view transition with circular reveal
    const transition = document.startViewTransition(() => {
      toggleMode()
    })

    // Apply circular reveal animation
    try {
      await transition.ready

      // Animate with clip-path for circular reveal effect
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    } catch (error) {
      // Fallback if animation fails
      console.debug('View transition animation failed:', error)
    }
  }

  // Map error to user-friendly translated message
  const getErrorMessage = (error: string | null): string => {
    if (!error) return ''

    // If error is our error key, translate it
    if (error === 'NEWSLETTER_SUBSCRIBE_ERROR') {
      return t('newsletter.errors.subscribeFailed')
    }

    // If error contains backend validation messages, display them
    // (parseApiError already extracts user-friendly messages from backend)
    return error
  }

  // Clear subscribe state and validation error when email changes
  useEffect(() => {
    if (subscribeError || subscribeSuccess) {
      clearSubscribeState()
    }
    if (validationError) {
      setValidationError('')
    }
    // Only run when email changes, not when error/success states change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

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
        mt: 'auto',
        backgroundColor: brandColors.footer.background,
        color: brandColors.footer.text,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        transition: (theme) =>
          theme.transitions.create(['background-color', 'color', 'border-color'], {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
          }),
      }}
    >
      <Container maxWidth="xl">
        {/* Main Footer Content */}
        <Box sx={{ py: { xs: 4, md: 6 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            {/* Brand Section */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                {t('common.appName')}
              </Typography>
              <Typography
                variant="body2"
                color={brandColors.footer.textSecondary}
                sx={{
                  mb: 3,
                  lineHeight: 1.7,
                  maxWidth: { md: '90%' },
                }}
              >
                {t('footer.tagline')}
              </Typography>

              {/* Social Media Icons */}
              <Stack direction="row" spacing={1.5}>
                <Box
                  component="a"
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: (theme) =>
                      mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    color: brandColors.footer.text,
                    transition: (theme) =>
                      theme.transitions.create(['background-color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      backgroundColor: (theme) =>
                        mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Facebook fontSize="small" />
                </Box>
                <Box
                  component="a"
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: (theme) =>
                      mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    color: brandColors.footer.text,
                    transition: (theme) =>
                      theme.transitions.create(['background-color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      backgroundColor: (theme) =>
                        mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Twitter fontSize="small" />
                </Box>
                <Box
                  component="a"
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: (theme) =>
                      mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    color: brandColors.footer.text,
                    transition: (theme) =>
                      theme.transitions.create(['background-color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      backgroundColor: (theme) =>
                        mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Instagram fontSize="small" />
                </Box>
                <Box
                  component="a"
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: (theme) =>
                      mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    color: brandColors.footer.text,
                    transition: (theme) =>
                      theme.transitions.create(['background-color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      backgroundColor: (theme) =>
                        mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <LinkedIn fontSize="small" />
                </Box>
              </Stack>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={6} sm={4} md={2}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                {t('footer.quickLinks')}
              </Typography>
              <Stack spacing={1.5}>
                <Link
                  component={RouterLink}
                  to="/products"
                  color="inherit"
                  underline="none"
                  sx={{
                    color: brandColors.footer.textSecondary,
                    fontSize: '0.875rem',
                    transition: (theme) =>
                      theme.transitions.create(['color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      color: brandColors.footer.text,
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  {t('nav.products')}
                </Link>
                <Link
                  component={RouterLink}
                  to="/about"
                  color="inherit"
                  underline="none"
                  sx={{
                    color: brandColors.footer.textSecondary,
                    fontSize: '0.875rem',
                    transition: (theme) =>
                      theme.transitions.create(['color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      color: brandColors.footer.text,
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  {t('footer.aboutUs')}
                </Link>
                <Link
                  component={RouterLink}
                  to="/contact"
                  color="inherit"
                  underline="none"
                  sx={{
                    color: brandColors.footer.textSecondary,
                    fontSize: '0.875rem',
                    transition: (theme) =>
                      theme.transitions.create(['color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      color: brandColors.footer.text,
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  {t('footer.contactUs')}
                </Link>
              </Stack>
            </Grid>

            {/* Customer Service */}
            <Grid item xs={6} sm={4} md={2}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                {t('footer.customerService')}
              </Typography>
              <Stack spacing={1.5}>
                <Link
                  component={RouterLink}
                  to="/help"
                  color="inherit"
                  underline="none"
                  sx={{
                    color: brandColors.footer.textSecondary,
                    fontSize: '0.875rem',
                    transition: (theme) =>
                      theme.transitions.create(['color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      color: brandColors.footer.text,
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  {t('footer.helpCenter')}
                </Link>
                <Link
                  component={RouterLink}
                  to="/returns"
                  color="inherit"
                  underline="none"
                  sx={{
                    color: brandColors.footer.textSecondary,
                    fontSize: '0.875rem',
                    transition: (theme) =>
                      theme.transitions.create(['color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      color: brandColors.footer.text,
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  {t('footer.returns')}
                </Link>
                <Link
                  component={RouterLink}
                  to="/shipping"
                  color="inherit"
                  underline="none"
                  sx={{
                    color: brandColors.footer.textSecondary,
                    fontSize: '0.875rem',
                    transition: (theme) =>
                      theme.transitions.create(['color', 'transform'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      color: brandColors.footer.text,
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  {t('footer.shippingInfo')}
                </Link>
              </Stack>
            </Grid>

            {/* Newsletter Subscription */}
            <Grid item xs={12} sm={4} md={4}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                {t('footer.newsletter')}
              </Typography>
              <Typography
                variant="body2"
                color={brandColors.footer.textSecondary}
                sx={{
                  mb: 2,
                  lineHeight: 1.7,
                  fontSize: '0.875rem',
                }}
              >
                {t('footer.subscribeNewsletter')}
              </Typography>

              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    label={t('footer.emailLabel')}
                    placeholder={t('footer.enterEmail')}
                    value={email}
                    onChange={handleEmailChange}
                    disabled={isSubscribing}
                    error={!!(subscribeError || validationError)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: (theme) =>
                          mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: (theme) =>
                            subscribeError || validationError
                              ? theme.palette.error.main
                              : mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(0, 0, 0, 0.12)',
                        },
                        '&:hover fieldset': {
                          borderColor: (theme) =>
                            subscribeError || validationError
                              ? theme.palette.error.main
                              : mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.23)'
                                : 'rgba(0, 0, 0, 0.23)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: (theme) =>
                            subscribeError || validationError
                              ? theme.palette.error.main
                              : theme.palette.primary.main,
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        color: brandColors.footer.text,
                        '&::placeholder': {
                          color: brandColors.footer.textSecondary,
                          opacity: 0.7,
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon
                            fontSize="small"
                            sx={{ color: brandColors.footer.textSecondary }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubscribing}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1,
                      boxShadow: (theme) =>
                        mode === 'dark'
                          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                          : '0 4px 12px rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        boxShadow: (theme) =>
                          mode === 'dark'
                            ? '0 6px 16px rgba(0, 0, 0, 0.4)'
                            : '0 6px 16px rgba(0, 0, 0, 0.15)',
                      },
                    }}
                  >
                    {isSubscribing ? t('common.loading') : t('footer.subscribe')}
                  </Button>
                </Box>

                {validationError && (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: 2,
                      fontSize: '0.875rem',
                    }}
                  >
                    {validationError}
                  </Alert>
                )}

                {subscribeError && (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: 2,
                      fontSize: '0.875rem',
                    }}
                  >
                    {getErrorMessage(subscribeError)}
                  </Alert>
                )}

                {subscribeSuccess && (
                  <Alert
                    severity="success"
                    sx={{
                      borderRadius: 2,
                      fontSize: '0.875rem',
                    }}
                  >
                    {t('common.success')}
                  </Alert>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Divider */}
        <Divider
          sx={{
            borderColor: (theme) =>
              mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          }}
        />

        {/* Bottom Bar */}
        <Box
          sx={{
            py: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Copyright and Language Selector */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Typography
              variant="body2"
              color={brandColors.footer.textSecondary}
              sx={{
                fontSize: '0.875rem',
                textAlign: { xs: 'center', sm: 'left' },
              }}
            >
              © {new Date().getFullYear()} {t('common.appName')}. {t('footer.allRightsReserved')}.
            </Typography>

            {/* Controls: Theme Toggle and Language Selector */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Theme Toggle */}
              <Tooltip title={mode === 'light' ? t('tooltip.switchToDarkMode') : t('tooltip.switchToLightMode')}>
                <IconButton
                  onClick={handleThemeToggle}
                  size="small"
                  role="switch"
                  aria-checked={mode === 'dark'}
                  aria-label={mode === 'light' ? t('tooltip.switchToDarkMode') : t('tooltip.switchToLightMode')}
                  sx={{
                    color: brandColors.footer.textSecondary,
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      color: brandColors.footer.text,
                      transform: 'rotate(180deg)',
                      backgroundColor: (_theme) =>
                        mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    },
                    '&:active': {
                      transform: 'scale(0.9) rotate(180deg)',
                    },
                  }}
                >
                  {mode === 'light' ? <Brightness4 fontSize="small" /> : <Brightness7 fontSize="small" />}
                </IconButton>
              </Tooltip>

              {/* Language Selector */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <LanguageIcon
                  sx={{
                    fontSize: '1.125rem',
                    color: brandColors.footer.textSecondary,
                  }}
                />
                <FormControl size="small">
                  <Select
                    value={i18n.resolvedLanguage || i18n.language.split('-')[0]}
                    onChange={handleLanguageChange}
                    variant="standard"
                    sx={{
                      color: brandColors.footer.text,
                      fontSize: '0.875rem',
                      '&:before': {
                        borderBottom: 'none',
                      },
                      '&:after': {
                        borderBottom: 'none',
                      },
                      '&:hover:not(.Mui-disabled):before': {
                        borderBottom: 'none',
                      },
                      '& .MuiSelect-select': {
                        py: 0.5,
                        pr: 3,
                        pl: 0.5,
                        '&:focus': {
                          backgroundColor: 'transparent',
                        },
                      },
                      '& .MuiSvgIcon-root': {
                        color: brandColors.footer.textSecondary,
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          mt: 1,
                          borderRadius: 2,
                          boxShadow: (_theme) =>
                            mode === 'dark'
                              ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                              : '0 4px 20px rgba(0, 0, 0, 0.15)',
                        },
                      },
                    }}
                  >
                    {Object.entries(LANGUAGES).map(([code, { nativeName }]) => (
                      <MenuItem
                        key={code}
                        value={code}
                        sx={{
                          fontSize: '0.875rem',
                          '&.Mui-selected': {
                            backgroundColor: (_theme) =>
                              mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                            '&:hover': {
                              backgroundColor: (_theme) =>
                                mode === 'dark'
                                  ? 'rgba(255, 255, 255, 0.12)'
                                  : 'rgba(0, 0, 0, 0.08)',
                            },
                          },
                        }}
                      >
                        {nativeName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Stack>

          {/* Legal Links */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              component={RouterLink}
              to="/privacy"
              color="inherit"
              underline="none"
              sx={{
                color: brandColors.footer.textSecondary,
                fontSize: '0.875rem',
                transition: (theme) =>
                  theme.transitions.create('color', {
                    duration: theme.transitions.duration.shorter,
                  }),
                '&:hover': {
                  color: brandColors.footer.text,
                },
              }}
            >
              {t('footer.privacyPolicy')}
            </Link>
            <Link
              component={RouterLink}
              to="/terms"
              color="inherit"
              underline="none"
              sx={{
                color: brandColors.footer.textSecondary,
                fontSize: '0.875rem',
                transition: (theme) =>
                  theme.transitions.create('color', {
                    duration: theme.transitions.duration.shorter,
                  }),
                '&:hover': {
                  color: brandColors.footer.text,
                },
              }}
            >
              {t('footer.termsOfService')}
            </Link>
            <Link
              component={RouterLink}
              to="/privacy"
              color="inherit"
              underline="none"
              sx={{
                color: brandColors.footer.textSecondary,
                fontSize: '0.875rem',
                transition: (theme) =>
                  theme.transitions.create('color', {
                    duration: theme.transitions.duration.shorter,
                  }),
                '&:hover': {
                  color: brandColors.footer.text,
                },
              }}
            >
              {t('footer.cookiePolicy')}
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
