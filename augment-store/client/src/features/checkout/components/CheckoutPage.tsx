import { useState, useCallback, useMemo, useEffect } from 'react'
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
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ContactMail as ContactMailIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material'
import { z } from 'zod'
import OrderSummary from '@/features/checkout/components/OrderSummary'
import { COUNTRIES } from '@constants/index'
import { userService } from '@services/api/user/userService'
import { useAuthStore } from '@store/authStore'
import { useTranslation } from '@hooks/useTranslation'

const nameRegex = /^[a-zA-Z\s\-']+$/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createContactInfoSchema = (t: any) =>
  z.object({
    email: z
      .string()
      .min(1, t('checkout.contactForm.errors.emailRequired'))
      .email(t('checkout.contactForm.errors.emailInvalid')),
    phone: z
      .string()
      .min(1, t('checkout.contactForm.errors.phoneRequired'))
      .transform((val) => val.replace(/[\s\-()]/g, ''))
      .refine(
        (val) => {
          const digitsOnly = val.replace(/^\+/, '')
          return /^\d+$/.test(digitsOnly)
        },
        {
          message: t('checkout.contactForm.errors.phoneInvalidChars'),
        }
      )
      .refine(
        (val) => {
          const digitsOnly = val.replace(/^\+/, '')
          return digitsOnly.length >= 10 && digitsOnly.length <= 15
        },
        { message: t('checkout.contactForm.errors.phoneInvalidLength') }
      )
      .refine(
        (val) => {
          const patterns = [/^\+?1?\d{10}$/, /^\+?\d{10,15}$/]
          return patterns.some((pattern) => pattern.test(val))
        },
        { message: t('checkout.contactForm.errors.phoneInvalidFormat') }
      ),
    firstName: z
      .string()
      .min(1, t('checkout.contactForm.errors.firstNameRequired'))
      .max(50, t('checkout.contactForm.errors.firstNameTooLong'))
      .regex(nameRegex, t('checkout.contactForm.errors.firstNameInvalidChars')),
    lastName: z
      .string()
      .min(1, t('checkout.contactForm.errors.lastNameRequired'))
      .max(50, t('checkout.contactForm.errors.lastNameTooLong'))
      .regex(nameRegex, t('checkout.contactForm.errors.lastNameInvalidChars')),
  })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createShippingAddressSchema = (t: any) =>
  z.object({
    address1: z
      .string()
      .min(1, t('checkout.shippingForm.errors.addressRequired'))
      .max(100, t('checkout.shippingForm.errors.addressTooLong')),
    address2: z.string().max(100, t('checkout.shippingForm.errors.addressTooLong')).optional(),
    city: z
      .string()
      .min(1, t('checkout.shippingForm.errors.cityRequired'))
      .max(50, t('checkout.shippingForm.errors.cityTooLong'))
      .regex(nameRegex, t('checkout.shippingForm.errors.cityInvalidChars')),
    state: z
      .string()
      .min(1, t('checkout.shippingForm.errors.stateRequired'))
      .max(50, t('checkout.shippingForm.errors.stateTooLong')),
    postalCode: z
      .string()
      .min(1, t('checkout.shippingForm.errors.postalCodeRequired'))
      .max(20, t('checkout.shippingForm.errors.postalCodeTooLong'))
      .regex(/^[a-zA-Z0-9\s-]+$/, t('checkout.shippingForm.errors.postalCodeInvalid')),
    country: z.string().min(1, t('checkout.shippingForm.errors.countryRequired')),
  })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createBillingAddressSchema = (t: any) =>
  z.object({
    address1: z
      .string()
      .min(1, t('checkout.billingForm.errors.addressRequired'))
      .max(100, t('checkout.billingForm.errors.addressTooLong')),
    address2: z.string().max(100, t('checkout.billingForm.errors.addressTooLong')).optional(),
    city: z
      .string()
      .min(1, t('checkout.billingForm.errors.cityRequired'))
      .max(50, t('checkout.billingForm.errors.cityTooLong'))
      .regex(nameRegex, t('checkout.billingForm.errors.cityInvalidChars')),
    state: z
      .string()
      .min(1, t('checkout.billingForm.errors.stateRequired'))
      .max(50, t('checkout.billingForm.errors.stateTooLong')),
    postalCode: z
      .string()
      .min(1, t('checkout.billingForm.errors.postalCodeRequired'))
      .max(20, t('checkout.billingForm.errors.postalCodeTooLong'))
      .regex(/^[a-zA-Z0-9\s-]+$/, t('checkout.billingForm.errors.postalCodeInvalid')),
    country: z.string().min(1, t('checkout.billingForm.errors.countryRequired')),
  })

// Derive types from the schema factories' return types
type ContactInfo = z.infer<ReturnType<typeof createContactInfoSchema>>
type ShippingAddress = z.infer<ReturnType<typeof createShippingAddressSchema>>
type BillingAddress = z.infer<ReturnType<typeof createBillingAddressSchema>>

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
  const { t } = useTranslation()

  // Create schemas with translations
  const contactInfoSchema = useMemo(() => createContactInfoSchema(t), [t])
  const shippingAddressSchema = useMemo(() => createShippingAddressSchema(t), [t])
  const billingAddressSchema = useMemo(() => createBillingAddressSchema(t), [t])

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

  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })

  const [sameAsShipping, setSameAsShipping] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Fetch user profile and pre-fill contact info (only for empty/untouched fields)
  useEffect(() => {
    let isMounted = true

    const fetchUserProfile = async () => {
      if (!isAuthenticated) return

      try {
        const profile = await userService.getProfile()

        // Only update state if component is still mounted
        if (!isMounted) return

        // Only update fields that are still empty and haven't been touched by the user
        setContactInfo((prev) => ({
          email: prev.email === '' && !touched.email ? profile.email || '' : prev.email,
          phone: prev.phone === '' && !touched.phone ? profile.mobile || '' : prev.phone,
          firstName:
            prev.firstName === '' && !touched.firstName ? profile.first_name || '' : prev.firstName,
          lastName:
            prev.lastName === '' && !touched.lastName ? profile.last_name || '' : prev.lastName,
        }))
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        // Silently fail - user can still fill in the form manually
      }
    }

    fetchUserProfile()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, touched.email, touched.phone, touched.firstName, touched.lastName])

  const createFieldValidator = useCallback(
    <T extends z.ZodTypeAny>(schema: z.ZodObject<Record<string, T>>, prefix: string = '') =>
      (field: string, value: string) => {
        const errorKey = prefix ? `${prefix}.${field}` : field
        try {
          schema.shape[field].parse(value)
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[errorKey as keyof typeof newErrors]
            return newErrors
          })
          return true
        } catch (error) {
          if (error instanceof z.ZodError) {
            setErrors((prev) => ({ ...prev, [errorKey]: error.issues[0]?.message || 'Invalid value' }))
            return false
          }
          return false
        }
      },
    []
  )

  const validateContactField = useCallback(createFieldValidator(contactInfoSchema, ''), [
    createFieldValidator,
    contactInfoSchema,
  ])

  const validateShippingField = useCallback(createFieldValidator(shippingAddressSchema, 'shipping'), [
    createFieldValidator,
    shippingAddressSchema,
  ])

  const validateBillingField = useCallback(
    createFieldValidator(billingAddressSchema, 'billing'),
    [createFieldValidator, billingAddressSchema]
  )

  const createChangeHandler = useCallback(
    <T extends Record<string, any>>(
      setter: React.Dispatch<React.SetStateAction<T>>,
      validator: (field: string, value: string) => boolean,
      prefix: string = ''
    ) =>
      (field: keyof T) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        const touchedKey = prefix ? `${prefix}.${String(field)}` : String(field)
        setter((prev) => ({ ...prev, [field]: value }))

        if (touched[touchedKey as keyof typeof touched]) {
          validator(field as string, value)
        }
      },
    [touched]
  )

  const handleContactChange = useCallback(
    createChangeHandler(setContactInfo, validateContactField, ''),
    [createChangeHandler, validateContactField]
  )

  const handleShippingChange = useCallback(
    createChangeHandler(setShippingAddress, validateShippingField, 'shipping'),
    [createChangeHandler, validateShippingField]
  )

  const createBlurHandler = useCallback(
    <T extends Record<string, any>>(
      data: T,
      validator: (field: string, value: string) => boolean,
      prefix: string = ''
    ) =>
      (field: keyof T) =>
      () => {
        const touchedKey = prefix ? `${prefix}.${String(field)}` : String(field)
        setTouched((prev) => ({ ...prev, [touchedKey]: true }))
        validator(field as string, (data[field] as string) || '')
      },
    []
  )

  const handleContactBlur = useCallback(createBlurHandler(contactInfo, validateContactField, ''), [
    contactInfo,
    validateContactField,
    createBlurHandler,
  ])

  const handleShippingBlur = useCallback(
    createBlurHandler(shippingAddress, validateShippingField, 'shipping'),
    [shippingAddress, validateShippingField, createBlurHandler]
  )

  const handleBillingChange = useCallback(
    createChangeHandler(setBillingAddress, validateBillingField, 'billing'),
    [createChangeHandler, validateBillingField]
  )

  const handleBillingBlur = useCallback(
    createBlurHandler(billingAddress, validateBillingField, 'billing'),
    [billingAddress, validateBillingField, createBlurHandler]
  )

  const handleSameAsShippingChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked
      setSameAsShipping(checked)
      if (checked) {
        setBillingAddress(shippingAddress)
        // Clear billing address errors when copying from shipping
        const billingFields: (keyof BillingAddress)[] = ['address1', 'address2', 'city', 'state', 'postalCode', 'country']
        setErrors((prev) => {
          const newErrors = { ...prev }
          billingFields.forEach((field) => {
            const errorKey = `billing.${field}`
            delete newErrors[errorKey as keyof typeof newErrors]
          })
          return newErrors
        })
        // Mark billing fields as touched when copying from shipping
        setTouched((prev) => {
          const newTouched = { ...prev }
          billingFields.forEach((field) => {
            const touchedKey = `billing.${field}`
            newTouched[touchedKey as keyof typeof newTouched] = true
          })
          return newTouched
        })
      }
    },
    [shippingAddress]
  )

  const checkFormCompletion = useCallback(
    <T extends Record<string, any>>(data: T, requiredFields: (keyof T)[], prefix: string = '') => {
      const allFieldsFilled = requiredFields.every((field) => {
        const value = data[field]
        return typeof value === 'string' && value.trim() !== ''
      })

      const noErrors = requiredFields.every((field) => {
        const errorKey = prefix ? `${prefix}.${String(field)}` : String(field)
        return !errors[errorKey as keyof typeof errors]
      })

      return allFieldsFilled && noErrors
    },
    [errors]
  )

  const isContactInfoComplete = useMemo(
    () => checkFormCompletion(contactInfo, ['firstName', 'lastName', 'email', 'phone'], ''),
    [contactInfo, checkFormCompletion]
  )

  const isShippingAddressComplete = useMemo(
    () =>
      checkFormCompletion(shippingAddress, ['address1', 'city', 'state', 'postalCode', 'country'], 'shipping'),
    [shippingAddress, checkFormCompletion]
  )

  const isBillingAddressComplete = useMemo(
    () =>
      sameAsShipping
        ? isShippingAddressComplete
        : checkFormCompletion(billingAddress, ['address1', 'city', 'state', 'postalCode', 'country'], 'billing'),
    [sameAsShipping, isShippingAddressComplete, billingAddress, checkFormCompletion]
  )

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
                    {t('checkout.contactForm.title')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('checkout.contactForm.subtitle')}
                  </Typography>
                </Box>
                {isContactInfoComplete && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={t('checkout.contactForm.complete')}
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
                    label={t('checkout.contactForm.firstName')}
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
                    label={t('checkout.contactForm.lastName')}
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
                    label={t('checkout.contactForm.emailAddress')}
                    type="email"
                    value={contactInfo.email}
                    onChange={handleContactChange('email')}
                    onBlur={handleContactBlur('email')}
                    error={touched.email && !!errors.email}
                    helperText={
                      touched.email && errors.email
                        ? errors.email
                        : t('checkout.contactForm.emailHelper')
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
                    label={t('checkout.contactForm.phoneNumber')}
                    type="tel"
                    value={contactInfo.phone}
                    onChange={handleContactChange('phone')}
                    onBlur={handleContactBlur('phone')}
                    error={touched.phone && !!errors.phone}
                    helperText={
                      touched.phone && errors.phone
                        ? errors.phone
                        : t('checkout.contactForm.phoneHelper')
                    }
                    placeholder={t('checkout.contactForm.phonePlaceholder')}
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
                    {t('checkout.shippingForm.title')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('checkout.shippingForm.subtitle')}
                  </Typography>
                </Box>
                {isShippingAddressComplete && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={t('checkout.shippingForm.complete')}
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
                    size="small"
                    label={t('checkout.shippingForm.streetAddress')}
                    value={shippingAddress.address1}
                    onChange={handleShippingChange('address1')}
                    onBlur={handleShippingBlur('address1')}
                    error={touched['shipping.address1'] && !!errors['shipping.address1']}
                    helperText={touched['shipping.address1'] && errors['shipping.address1'] ? errors['shipping.address1'] : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('checkout.shippingForm.apartmentSuite')}
                    value={shippingAddress.address2}
                    onChange={handleShippingChange('address2')}
                    onBlur={handleShippingBlur('address2')}
                    error={touched['shipping.address2'] && !!errors['shipping.address2']}
                    helperText={touched['shipping.address2'] && errors['shipping.address2'] ? errors['shipping.address2'] : ''}
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('checkout.shippingForm.city')}
                    value={shippingAddress.city}
                    onChange={handleShippingChange('city')}
                    onBlur={handleShippingBlur('city')}
                    error={touched['shipping.city'] && !!errors['shipping.city']}
                    helperText={touched['shipping.city'] && errors['shipping.city'] ? errors['shipping.city'] : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('checkout.shippingForm.stateProvince')}
                    value={shippingAddress.state}
                    onChange={handleShippingChange('state')}
                    onBlur={handleShippingBlur('state')}
                    error={touched['shipping.state'] && !!errors['shipping.state']}
                    helperText={touched['shipping.state'] && errors['shipping.state'] ? errors['shipping.state'] : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('checkout.shippingForm.postalCode')}
                    value={shippingAddress.postalCode}
                    onChange={handleShippingChange('postalCode')}
                    onBlur={handleShippingBlur('postalCode')}
                    error={touched['shipping.postalCode'] && !!errors['shipping.postalCode']}
                    helperText={touched['shipping.postalCode'] && errors['shipping.postalCode'] ? errors['shipping.postalCode'] : ''}
                    required
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label={t('checkout.shippingForm.country')}
                    value={shippingAddress.country}
                    onChange={handleShippingChange('country')}
                    onBlur={handleShippingBlur('country')}
                    error={touched['shipping.country'] && !!errors['shipping.country']}
                    helperText={touched['shipping.country'] && errors['shipping.country'] ? errors['shipping.country'] : ''}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <ReceiptIcon color="primary" sx={{ fontSize: 28 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {t('checkout.billingForm.title')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('checkout.billingForm.subtitle')}
                  </Typography>
                </Box>
                {isBillingAddressComplete && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={t('checkout.billingForm.complete')}
                    color="success"
                    size="small"
                    sx={{ mr: 2 }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={ACCORDION_DETAILS_STYLES}>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={<Checkbox checked={sameAsShipping} onChange={handleSameAsShippingChange} />}
                  label={t('checkout.billingForm.sameAsShipping')}
                />
              </Box>

              {!sameAsShipping && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('checkout.billingForm.streetAddress')}
                      value={billingAddress.address1}
                      onChange={handleBillingChange('address1')}
                      onBlur={handleBillingBlur('address1')}
                      error={touched['billing.address1'] && !!errors['billing.address1']}
                      helperText={touched['billing.address1'] && errors['billing.address1'] ? errors['billing.address1'] : ''}
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('checkout.billingForm.apartmentSuite')}
                      value={billingAddress.address2}
                      onChange={handleBillingChange('address2')}
                      onBlur={handleBillingBlur('address2')}
                      error={touched['billing.address2'] && !!errors['billing.address2']}
                      helperText={touched['billing.address2'] && errors['billing.address2'] ? errors['billing.address2'] : ''}
                      variant="outlined"
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('checkout.billingForm.city')}
                      value={billingAddress.city}
                      onChange={handleBillingChange('city')}
                      onBlur={handleBillingBlur('city')}
                      error={touched['billing.city'] && !!errors['billing.city']}
                      helperText={touched['billing.city'] && errors['billing.city'] ? errors['billing.city'] : ''}
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('checkout.billingForm.stateProvince')}
                      value={billingAddress.state}
                      onChange={handleBillingChange('state')}
                      onBlur={handleBillingBlur('state')}
                      error={touched['billing.state'] && !!errors['billing.state']}
                      helperText={touched['billing.state'] && errors['billing.state'] ? errors['billing.state'] : ''}
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t('checkout.billingForm.postalCode')}
                      value={billingAddress.postalCode}
                      onChange={handleBillingChange('postalCode')}
                      onBlur={handleBillingBlur('postalCode')}
                      error={touched['billing.postalCode'] && !!errors['billing.postalCode']}
                      helperText={touched['billing.postalCode'] && errors['billing.postalCode'] ? errors['billing.postalCode'] : ''}
                      required
                      variant="outlined"
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label={t('checkout.billingForm.country')}
                      value={billingAddress.country}
                      onChange={handleBillingChange('country')}
                      onBlur={handleBillingBlur('country')}
                      error={touched['billing.country'] && !!errors['billing.country']}
                      helperText={touched['billing.country'] && errors['billing.country'] ? errors['billing.country'] : ''}
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
              )}
            </AccordionDetails>
          </Accordion>
        </Box>

        <OrderSummary
          isContactInfoComplete={isContactInfoComplete}
          isShippingAddressComplete={isShippingAddressComplete}
          isBillingAddressComplete={isBillingAddressComplete}
          contactInfo={contactInfo}
          shippingAddress={shippingAddress}
          billingAddress={billingAddress}
        />
      </Stack>
    </Container>
  )
}

export default CheckoutPage
