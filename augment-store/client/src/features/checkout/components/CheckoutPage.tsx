import { useState, useCallback } from 'react'
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

const contactInfoSchema = z.object({
  email: z.email('Invalid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
})

type ContactInfo = z.infer<typeof contactInfoSchema>

const CheckoutPage = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ContactInfo, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof ContactInfo, boolean>>>({})

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
    contactInfo.firstName &&
    contactInfo.lastName &&
    contactInfo.email &&
    contactInfo.phone &&
    Object.keys(errors).length === 0

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
                    label="Email Address"
                    type="email"
                    value={contactInfo.email}
                    onChange={handleContactChange('email')}
                    onBlur={handleBlur('email')}
                    error={touched.email && !!errors.email}
                    helperText={
                      touched.email && errors.email ? errors.email : "We'll send your order confirmation here"
                    }
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={handleContactChange('phone')}
                    onBlur={handleBlur('phone')}
                    error={touched.phone && !!errors.phone}
                    helperText={
                      touched.phone && errors.phone ? errors.phone : 'For delivery updates and support'
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
