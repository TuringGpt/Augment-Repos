import { useState, useCallback, useEffect } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  Stack,
  Typography,
  TextField,
  Grid,
  Box,
  Chip,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ContactMail as ContactMailIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { z } from 'zod'
import OrderSummary from '@/features/checkout/components/OrderSummary'
import { userService } from '@services/api/user/userService'
import { useAuthStore } from '@store/authStore'

const contactInfoSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .transform((val) => val.replace(/[\s\-()]/g, ''))
    .refine(
      (val) => {
        // Remove any leading + sign for digit counting
        const digitsOnly = val.replace(/^\+/, '')
        // Check if it contains only digits after removing the optional +
        return /^\d+$/.test(digitsOnly)
      },
      {
        message:
          'Phone number can only contain digits, spaces, hyphens, parentheses, and an optional + prefix',
      }
    )
    .refine(
      (val) => {
        // Count digits only (excluding the + sign)
        const digitsOnly = val.replace(/^\+/, '')
        return digitsOnly.length >= 10 && digitsOnly.length <= 15
      },
      { message: 'Phone number must be between 10 and 15 digits' }
    )
    .refine(
      (val) => {
        // Validate common international formats
        const patterns = [
          /^\+?1?\d{10}$/, // US/Canada: +1XXXXXXXXXX or XXXXXXXXXX (10 digits)
          /^\+?\d{10,15}$/, // International: 10-15 digits with optional +
        ]
        return patterns.some((pattern) => pattern.test(val))
      },
      { message: 'Invalid phone number format' }
    ),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(
      /^[a-zA-Z\s\-']+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(
      /^[a-zA-Z\s\-']+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    ),
})

type ContactInfo = z.infer<typeof contactInfoSchema>

const CheckoutPage = () => {
  const { isAuthenticated } = useAuthStore()
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ContactInfo, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof ContactInfo, boolean>>>({})

  // Fetch user profile and pre-fill contact info (only for empty/untouched fields)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) return

      try {
        const profile = await userService.getProfile()

        // Only update fields that are still empty and haven't been touched by the user
        setContactInfo((prev) => ({
          email: prev.email === '' ? profile.email || '' : prev.email,
          phone: prev.phone === '' ? profile.mobile || '' : prev.phone,
          firstName: prev.firstName === '' ? profile.first_name || '' : prev.firstName,
          lastName: prev.lastName === '' ? profile.last_name || '' : prev.lastName,
        }))
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        // Silently fail - user can still fill in the form manually
      }
    }

    fetchUserProfile()
  }, [isAuthenticated])

  const validateField = useCallback((field: keyof ContactInfo, value: string) => {
    try {
      contactInfoSchema.shape[field].parse(value)
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: error.issues[0]?.message || 'Invalid value' }))
        return false
      }
      return false
    }
  }, [])

  const handleContactChange = useCallback(
    (field: keyof ContactInfo) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setContactInfo((prev) => ({
        ...prev,
        [field]: value,
      }))

      // Only validate if field has been touched
      if (touched[field]) {
        validateField(field, value)
      }
    },
    [touched, validateField]
  )

  const handleBlur = useCallback(
    (field: keyof ContactInfo) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }))
      validateField(field, contactInfo[field])
    },
    [contactInfo, validateField]
  )

  const isContactInfoComplete =
    contactInfo.firstName.trim() !== '' &&
    contactInfo.lastName.trim() !== '' &&
    contactInfo.email.trim() !== '' &&
    contactInfo.phone.trim() !== '' &&
    Object.keys(errors).length === 0 &&
    touched.firstName &&
    touched.lastName &&
    touched.email &&
    touched.phone

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Checkout
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete your order by filling out the information below
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, width: '100%' }}>
          {/* Contact Information */}
          <Accordion
            defaultExpanded
            sx={{
              mb: 2,
              '&:before': { display: 'none' },
              boxShadow: 2,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                px: 3,
                py: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <ContactMailIcon color="primary" sx={{ fontSize: 28 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Contact Information
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    We'll use this to contact you about your order
                  </Typography>
                </Box>
                {isContactInfoComplete && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Complete"
                    color="success"
                    size="small"
                    sx={{ mr: 2 }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, py: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="First Name"
                    value={contactInfo.firstName}
                    onChange={handleContactChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    error={touched.firstName && !!errors.firstName}
                    helperText={touched.firstName && errors.firstName ? errors.firstName : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Last Name"
                    value={contactInfo.lastName}
                    onChange={handleContactChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    error={touched.lastName && !!errors.lastName}
                    helperText={touched.lastName && errors.lastName ? errors.lastName : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Email Address"
                    type="email"
                    value={contactInfo.email}
                    onChange={handleContactChange('email')}
                    onBlur={handleBlur('email')}
                    error={touched.email && !!errors.email}
                    helperText={
                      touched.email && errors.email
                        ? errors.email
                        : "We'll send your order confirmation here"
                    }
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Phone Number"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={handleContactChange('phone')}
                    onBlur={handleBlur('phone')}
                    error={touched.phone && !!errors.phone}
                    helperText={
                      touched.phone && errors.phone
                        ? errors.phone
                        : 'Enter 10-15 digits. Format: +1 (555) 123-4567 or 5551234567'
                    }
                    placeholder="+1 (555) 123-4567"
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Shipping Address */}
          <Accordion
            sx={{
              mb: 2,
              '&:before': { display: 'none' },
              boxShadow: 2,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                px: 3,
                py: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocalShippingIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Shipping Address
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Where should we deliver your order?
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, py: 3, bgcolor: 'grey.50' }}>
              <Typography color="text.secondary">Shipping address form coming soon...</Typography>
            </AccordionDetails>
          </Accordion>

          {/* Billing Address */}
          <Accordion
            sx={{
              mb: 2,
              '&:before': { display: 'none' },
              boxShadow: 2,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                px: 3,
                py: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PaymentIcon color="primary" sx={{ fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Billing Address
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Payment and billing information
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, py: 3, bgcolor: 'grey.50' }}>
              <Typography color="text.secondary">Billing address form coming soon...</Typography>
            </AccordionDetails>
          </Accordion>
        </Box>

        <OrderSummary />
      </Stack>
    </Container>
  )
}

export default CheckoutPage
