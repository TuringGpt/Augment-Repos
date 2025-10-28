import type { UpdateProfileRequest, UserProfile } from '@features/user/types'

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  USERNAME: {
    REQUIRED: 'Username is required',
    MIN_LENGTH: 'Username must be at least 3 characters',
    MAX_LENGTH: 'Username must be less than 150 characters',
  },
  FIRST_NAME: {
    REQUIRED: 'First name is required',
    MIN_LENGTH: 'First name must be at least 2 characters',
    MAX_LENGTH: 'First name must be less than 150 characters',
  },
  LAST_NAME: {
    REQUIRED: 'Last name is required',
    MIN_LENGTH: 'Last name must be at least 2 characters',
    MAX_LENGTH: 'Last name must be less than 150 characters',
  },
  MOBILE: {
    MAX_LENGTH: 'Mobile number must be less than 20 characters',
  },
  FORM: {
    NO_CHANGES: 'No changes detected. Please modify at least one field.',
  },
} as const

/**
 * Validation constraints
 */
export const VALIDATION_CONSTRAINTS = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 150,
  },
  FIRST_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 150,
  },
  LAST_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 150,
  },
  MOBILE: {
    MAX_LENGTH: 20,
  },
} as const

/**
 * Validate username field
 */
export const validateUsername = (value?: string): string | null => {
  if (!value || value.trim() === '') {
    return VALIDATION_MESSAGES.USERNAME.REQUIRED
  }
  if (value.trim().length < VALIDATION_CONSTRAINTS.USERNAME.MIN_LENGTH) {
    return VALIDATION_MESSAGES.USERNAME.MIN_LENGTH
  }
  if (value.trim().length > VALIDATION_CONSTRAINTS.USERNAME.MAX_LENGTH) {
    return VALIDATION_MESSAGES.USERNAME.MAX_LENGTH
  }
  return null
}

/**
 * Validate first name field
 */
export const validateFirstName = (value?: string): string | null => {
  if (!value || value.trim() === '') {
    return VALIDATION_MESSAGES.FIRST_NAME.REQUIRED
  }
  if (value.trim().length < VALIDATION_CONSTRAINTS.FIRST_NAME.MIN_LENGTH) {
    return VALIDATION_MESSAGES.FIRST_NAME.MIN_LENGTH
  }
  if (value.trim().length > VALIDATION_CONSTRAINTS.FIRST_NAME.MAX_LENGTH) {
    return VALIDATION_MESSAGES.FIRST_NAME.MAX_LENGTH
  }
  return null
}

/**
 * Validate last name field
 */
export const validateLastName = (value?: string): string | null => {
  if (!value || value.trim() === '') {
    return VALIDATION_MESSAGES.LAST_NAME.REQUIRED
  }
  if (value.trim().length < VALIDATION_CONSTRAINTS.LAST_NAME.MIN_LENGTH) {
    return VALIDATION_MESSAGES.LAST_NAME.MIN_LENGTH
  }
  if (value.trim().length > VALIDATION_CONSTRAINTS.LAST_NAME.MAX_LENGTH) {
    return VALIDATION_MESSAGES.LAST_NAME.MAX_LENGTH
  }
  return null
}

/**
 * Validate mobile field
 */
export const validateMobile = (value?: string): string | null => {
  if (value && value.trim() !== '' && value.length > VALIDATION_CONSTRAINTS.MOBILE.MAX_LENGTH) {
    return VALIDATION_MESSAGES.MOBILE.MAX_LENGTH
  }
  return null
}

/**
 * Check if any field has changed from the original profile
 */
export const hasProfileChanges = (
  values: UpdateProfileRequest,
  profile: UserProfile | null
): boolean => {
  if (!profile) return false

  return (
    (values.username !== undefined && values.username !== (profile.username || '')) ||
    (values.first_name !== undefined && values.first_name !== (profile.first_name || '')) ||
    (values.last_name !== undefined && values.last_name !== (profile.last_name || '')) ||
    (values.mobile !== undefined && values.mobile !== (profile.mobile || '')) ||
    (values.gender !== undefined && values.gender !== (profile.gender || ''))
  )
}

/**
 * Get only the changed fields from form values
 */
export const getChangedFields = (
  values: UpdateProfileRequest,
  profile: UserProfile | null
): UpdateProfileRequest => {
  const updateData: UpdateProfileRequest = {}

  if (!profile) return updateData

  if (values.username && values.username !== (profile.username || '')) {
    updateData.username = values.username
  }
  if (values.first_name && values.first_name !== (profile.first_name || '')) {
    updateData.first_name = values.first_name
  }
  if (values.last_name && values.last_name !== (profile.last_name || '')) {
    updateData.last_name = values.last_name
  }
  if (values.mobile && values.mobile !== (profile.mobile || '')) {
    updateData.mobile = values.mobile
  }
  if (values.gender && values.gender !== (profile.gender || '')) {
    updateData.gender = values.gender
  }

  return updateData
}

/**
 * Main validation function for profile form
 */
export const validateProfileForm = (
  values: UpdateProfileRequest,
  profile: UserProfile | null
): Record<string, string> => {
  const errors: Record<string, string> = {}

  // Field-level validation
  const usernameError = validateUsername(values.username)
  if (usernameError) errors.username = usernameError

  const firstNameError = validateFirstName(values.first_name)
  if (firstNameError) errors.first_name = firstNameError

  const lastNameError = validateLastName(values.last_name)
  if (lastNameError) errors.last_name = lastNameError

  const mobileError = validateMobile(values.mobile)
  if (mobileError) errors.mobile = mobileError

  // Form-level validation: check if any field has changed
  if (!hasProfileChanges(values, profile)) {
    errors.username = errors.username || VALIDATION_MESSAGES.FORM.NO_CHANGES
  }

  return errors
}

