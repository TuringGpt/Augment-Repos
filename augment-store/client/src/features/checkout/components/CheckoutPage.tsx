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
  MenuItem,
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

const nameRegex = /^[a-zA-Z\s\-']+$/
const nameErrorMessage = 'can only contain letters, spaces, hyphens, and apostrophes'

const contactInfoSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .transform((val) => val.replace(/[\s\-()]/g, ''))
    .refine(
      (val) => {
        const digitsOnly = val.replace(/^\+/, '')
        return /^\d+$/.test(digitsOnly)
      },
      {
        message:
          'Phone number can only contain digits, spaces, hyphens, parentheses, and an optional + prefix',
      }
    )
    .refine(
      (val) => {
        const digitsOnly = val.replace(/^\+/, '')
        return digitsOnly.length >= 10 && digitsOnly.length <= 15
      },
      { message: 'Phone number must be between 10 and 15 digits' }
    )
    .refine(
      (val) => {
        const patterns = [/^\+?1?\d{10}$/, /^\+?\d{10,15}$/]
        return patterns.some((pattern) => pattern.test(val))
      },
      { message: 'Invalid phone number format' }
    ),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(nameRegex, `First name ${nameErrorMessage}`),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(nameRegex, `Last name ${nameErrorMessage}`),
})

const shippingAddressSchema = z.object({
  address1: z.string().min(1, 'Street address is required').max(100, 'Address is too long'),
  address2: z.string().max(100, 'Address is too long').optional(),
  city: z
    .string()
    .min(1, 'City is required')
    .max(50, 'City name is too long')
    .regex(nameRegex, `City ${nameErrorMessage}`),
  state: z.string().min(1, 'State/Province is required').max(50, 'State/Province is too long'),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .max(20, 'Postal code is too long')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Invalid postal code format'),
  country: z.string().min(1, 'Country is required'),
})

type ContactInfo = z.infer<typeof contactInfoSchema>
type ShippingAddress = z.infer<typeof shippingAddressSchema>

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
]

const ACCORDION_STYLES = {
  mb: 2,
  '&:before': { display: 'none' },
  boxShadow: 2,
  borderRadius: 2,
  overflow: 'hidden',
}

const ACCORDION_SUMMARY_STYLES = {
  bgcolor: 'background.paper',
  '&:hover': { bgcolor: 'action.hover' },
  px: 3,
  py: 1.5,
}

const ACCORDION_DETAILS_STYLES = { px: 3, py: 3, bgcolor: 'grey.50' }

const CheckoutPage = () => {
  const { isAuthenticated } = useAuthStore()
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
  })

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactInfo | keyof ShippingAddress, string>>
  >({})
  const [touched, setTouched] = useState<
    Partial<Record<keyof ContactInfo | keyof ShippingAddress, boolean>>
  >({})

  const createFieldValidator = useCallback(
    <T extends z.ZodTypeAny>(schema: z.ZodObject<Record<string, T>>) =>
      (field: string, value: string) => {
        try {
          schema.shape[field].parse(value)
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[field as keyof typeof newErrors]
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
      },
    []
  )

  const validateContactField = useCallback(createFieldValidator(contactInfoSchema), [
    createFieldValidator,
  ])

  const validateShippingField = useCallback(createFieldValidator(shippingAddressSchema), [
    createFieldValidator,
  ])

  const createChangeHandler = useCallback(
    <T extends Record<string, any>>(
      setter: React.Dispatch<React.SetStateAction<T>>,
      validator: (field: string, value: string) => boolean
    ) =>
      (field: keyof T) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setter((prev) => ({ ...prev, [field]: value }))

        if (touched[field as keyof typeof touched]) {
          validator(field as string, value)
        }
      },
    [touched]
  )

  const handleContactChange = useCallback(
    createChangeHandler(setContactInfo, validateContactField),
    [createChangeHandler, validateContactField]
  )

  const handleShippingChange = useCallback(
    createChangeHandler(setShippingAddress, validateShippingField),
    [createChangeHandler, validateShippingField]
  )

  const createBlurHandler = useCallback(
    <T extends Record<string, any>>(
      data: T,
      validator: (field: string, value: string) => boolean
    ) =>
      (field: keyof T) =>
      () => {
        setTouched((prev) => ({ ...prev, [field]: true }))
        validator(field as string, (data[field] as string) || '')
      },
    []
  )

  const handleContactBlur = useCallback(createBlurHandler(contactInfo, validateContactField), [
    contactInfo,
    validateContactField,
    createBlurHandler,
  ])

  const handleShippingBlur = useCallback(
    createBlurHandler(shippingAddress, validateShippingField),
    [shippingAddress, validateShippingField, createBlurHandler]
  )

  const checkFormCompletion = useCallback(
    <T extends Record<string, any>>(data: T, requiredFields: (keyof T)[]) => {
      const allFieldsFilled = requiredFields.every((field) => {
        const value = data[field]
        return typeof value === 'string' && value.trim() !== ''
      })

      const noErrors = requiredFields.every((field) => !errors[field as keyof typeof errors])
      const allTouched = requiredFields.every((field) => touched[field as keyof typeof touched])

      return allFieldsFilled && noErrors && allTouched
    },
    [errors, touched]
  )

  const isContactInfoComplete = checkFormCompletion(contactInfo, [
    'firstName',
    'lastName',
    'email',
    'phone',
  ])

  const isShippingAddressComplete = checkFormCompletion(shippingAddress, [
    'address1',
    'city',
    'state',
    'postalCode',
    'country',
  ])

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
          <Accordion defaultExpanded sx={ACCORDION_STYLES}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={ACCORDION_SUMMARY_STYLES}>
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
            <AccordionDetails sx={ACCORDION_DETAILS_STYLES}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="First Name"
                    value={contactInfo.firstName}
                    onChange={handleContactChange('firstName')}
                    onBlur={handleContactBlur('firstName')}
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
                    onBlur={handleContactBlur('lastName')}
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
                    onBlur={handleContactBlur('email')}
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
                    onBlur={handleContactBlur('phone')}
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
          <Accordion sx={ACCORDION_STYLES}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={ACCORDION_SUMMARY_STYLES}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <LocalShippingIcon color="primary" sx={{ fontSize: 28 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Shipping Address
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Where should we deliver your order?
                  </Typography>
                </Box>
                {isShippingAddressComplete && (
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
            <AccordionDetails sx={ACCORDION_DETAILS_STYLES}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    value={shippingAddress.address1}
                    onChange={handleShippingChange('address1')}
                    onBlur={handleShippingBlur('address1')}
                    error={touched.address1 && !!errors.address1}
                    helperText={touched.address1 && errors.address1 ? errors.address1 : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Apartment, suite, etc. (optional)"
                    value={shippingAddress.address2}
                    onChange={handleShippingChange('address2')}
                    onBlur={handleShippingBlur('address2')}
                    error={touched.address2 && !!errors.address2}
                    helperText={touched.address2 && errors.address2 ? errors.address2 : ''}
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={shippingAddress.city}
                    onChange={handleShippingChange('city')}
                    onBlur={handleShippingBlur('city')}
                    error={touched.city && !!errors.city}
                    helperText={touched.city && errors.city ? errors.city : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={shippingAddress.state}
                    onChange={handleShippingChange('state')}
                    onBlur={handleShippingBlur('state')}
                    error={touched.state && !!errors.state}
                    helperText={touched.state && errors.state ? errors.state : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={shippingAddress.postalCode}
                    onChange={handleShippingChange('postalCode')}
                    onBlur={handleShippingBlur('postalCode')}
                    error={touched.postalCode && !!errors.postalCode}
                    helperText={touched.postalCode && errors.postalCode ? errors.postalCode : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Country"
                    value={shippingAddress.country}
                    onChange={handleShippingChange('country')}
                    onBlur={handleShippingBlur('country')}
                    error={touched.country && !!errors.country}
                    helperText={touched.country && errors.country ? errors.country : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    {COUNTRIES.map((country) => (
                      <MenuItem key={country.value} value={country.value}>
                        {country.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Billing Address */}
          <Accordion sx={ACCORDION_STYLES}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={ACCORDION_SUMMARY_STYLES}>
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
            <AccordionDetails sx={ACCORDION_DETAILS_STYLES}>
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
