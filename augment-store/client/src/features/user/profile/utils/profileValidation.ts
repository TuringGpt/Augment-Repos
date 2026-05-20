import { z } from 'zod'
import type { UpdateProfileRequest, UserProfile } from '@features/user/types'

/**
 * Zod schema for profile update validation
 */
export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(150, 'Username must be less than 150 characters'),
  first_name: z
    .string()
    .min(1, 'First name is required')
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(150, 'First name must be less than 150 characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(150, 'Last name must be less than 150 characters'),
  mobile: z
    .string()
    .max(20, 'Mobile number must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Other']), // Required field, backend default is 'Other'
})

/**
 * Infer TypeScript type from Zod schema
 */
export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>

/**
 * Zod resolver for Mantine form
 * Converts Zod validation to Mantine form errors format
 */
export const zodResolver =
  <T extends z.ZodType>(schema: T) =>
  (values: unknown): Record<string, string> => {
    const result = schema.safeParse(values)

    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        errors[path] = issue.message
      })
      return errors
    }

    return {}
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
 * Uses !== undefined to allow clearing fields (e.g., setting mobile to empty string)
 */
export const getChangedFields = (
  values: UpdateProfileRequest,
  profile: UserProfile | null
): UpdateProfileRequest => {
  const updateData: UpdateProfileRequest = {}

  if (!profile) return updateData

  if (values.username !== undefined && values.username !== (profile.username || '')) {
    updateData.username = values.username
  }
  if (values.first_name !== undefined && values.first_name !== (profile.first_name || '')) {
    updateData.first_name = values.first_name
  }
  if (values.last_name !== undefined && values.last_name !== (profile.last_name || '')) {
    updateData.last_name = values.last_name
  }
  if (values.mobile !== undefined && values.mobile !== (profile.mobile || '')) {
    updateData.mobile = values.mobile
  }
  if (values.gender !== undefined && values.gender !== (profile.gender || '')) {
    updateData.gender = values.gender
  }

  return updateData
}

/**
 * Main validation function for profile form using Zod
 * Combines schema validation with custom business logic (change detection)
 */
export const validateProfileForm = (
  values: UpdateProfileRequest,
  profile: UserProfile | null
): Record<string, string> => {
  // Field-level validation using Zod resolver
  const errors = zodResolver(profileUpdateSchema)(values)

  // Form-level validation: check if any field has changed
  if (!hasProfileChanges(values, profile)) {
    errors.username = errors.username || 'No changes detected. Please modify at least one field.'
  }

  return errors
}
