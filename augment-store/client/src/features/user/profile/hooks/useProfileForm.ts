import { useForm } from '@mantine/form'
import type { UpdateProfileRequest, UserProfile } from '@features/user/types'
import { validateProfileForm } from '../utils/profileValidation'

/**
 * Custom hook for profile form management
 */
export const useProfileForm = (profile: UserProfile | null) => {
  const form = useForm<UpdateProfileRequest>({
    initialValues: {
      username: '',
      first_name: '',
      last_name: '',
      mobile: '',
      gender: 'Other', // Backend default
    },
    validate: (values) => validateProfileForm(values, profile),
  })

  /**
   * Set form values from profile data
   */
  const setProfileValues = (profileData: UserProfile) => {
    form.setValues({
      username: profileData.username || '',
      first_name: profileData.first_name || '',
      last_name: profileData.last_name || '',
      mobile: profileData.mobile || '',
      gender: profileData.gender, // Backend always returns a value
    })
  }

  /**
   * Reset form to profile values
   */
  const resetToProfile = (profileData: UserProfile) => {
    form.reset()
    setProfileValues(profileData)
  }

  return {
    form,
    setProfileValues,
    resetToProfile,
  }
}
