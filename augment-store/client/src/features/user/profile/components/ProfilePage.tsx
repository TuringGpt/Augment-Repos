import { useState, useEffect, useRef } from 'react'
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Button,
  Grid,
  MenuItem,
} from '@mui/material'
import { Edit, Save, Cancel, Logout, HelpOutline } from '@mui/icons-material'
import delay from 'lodash/delay'
import { useNavigate } from 'react-router-dom'
import { ProfileSkeleton } from '@components/skeletons'
import { userService } from '@services/api/user/userService'
import { storageService } from '@services/api/storage/storageService'
import { authService } from '@services/api/auth/authService'
import type { UserProfile } from '@features/user/types'
import { Colors } from '@config/colors'
import { useProfileForm } from '../hooks/useProfileForm'
import { getChangedFields } from '../utils/profileValidation'
import { AvatarUpload } from './AvatarUpload'
import { parseApiError } from '@utils/errorUtils'
import { useTranslation } from '@hooks/useTranslation'

const ProfilePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Avatar upload state (consolidated)
  const [avatarState, setAvatarState] = useState({
    isUploading: false,
    error: null as string | null,
    newUrl: null as string | null,
  })

  // Ref to store timeout ID for cleanup
  const successTimeoutRef = useRef<number | null>(null)

  // Profile form with validation
  const { form, setProfileValues, resetToProfile } = useProfileForm(profile)

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current !== null) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const profileData = await userService.getProfile()
      setProfile(profileData)
      setProfileValues(profileData)
    } catch (err) {
      const errorMessage = parseApiError(err, {
        defaultMessage: t('user.profilePage.messages.failedToLoadProfile'),
      })
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    setSuccessMessage(null)

    // Reset form to current profile data
    if (profile) {
      resetToProfile(profile)
    }
  }

  const handleSave = form.onSubmit(async (values) => {
    // Prevent concurrent submissions
    if (isSaving) return

    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Clear any existing success message timeout
      if (successTimeoutRef.current !== null) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }

      // Get only changed fields
      const updateData = getChangedFields(values, profile)

      // Update profile via API
      const updatedProfile = await userService.updateProfile(updateData)
      setProfile(updatedProfile)
      setProfileValues(updatedProfile)

      setIsEditing(false)
      setSuccessMessage(t('user.profilePage.messages.profileUpdatedSuccess'))

      // Auto-hide success message after 3 seconds
      successTimeoutRef.current = delay(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = parseApiError(err, {
        fieldNames: ['first_name', 'last_name', 'phone'],
        defaultMessage: t('user.profilePage.messages.failedToUpdateProfile'),
      })
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  })

  const handleAvatarSelect = async (file: File) => {
    setAvatarState({ isUploading: true, error: null, newUrl: null })

    try {
      // Upload avatar to storage and get file ID
      const fileId = await storageService.uploadAvatar(file)
      console.log('📤 Received file ID from upload:', fileId)

      // Get any pending form changes (if user is editing)
      const formChanges = getChangedFields(form.values, profile)

      // Combine avatar update with any pending form changes
      const updateData = {
        ...formChanges,
        profile_image: fileId,
      }

      // Update profile with file ID (ForeignKey to storage.File) + any form changes
      const updatedProfile = await userService.updateProfile(updateData)
      setProfile(updatedProfile)
      setProfileValues(updatedProfile)

      // Update avatar state with the new image URL from profile_image.file
      const newAvatarUrl = updatedProfile.profile_image?.file || updatedProfile.image || null
      console.log('🖼️ New avatar URL from server:', newAvatarUrl)
      console.log('📦 Updated profile:', updatedProfile)
      setAvatarState((prev) => ({ ...prev, newUrl: newAvatarUrl }))

      setSuccessMessage(t('user.profilePage.messages.avatarUpdatedSuccess'))
      successTimeoutRef.current = delay(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = parseApiError(err, {
        fieldNames: ['profile_image'],
        defaultMessage: t('user.profilePage.messages.failedToUploadAvatar'),
      })
      setAvatarState((prev) => ({ ...prev, error: errorMessage }))
    } finally {
      setAvatarState((prev) => ({ ...prev, isUploading: false }))
    }
  }

  const handleAvatarRemove = async () => {
    setAvatarState({ isUploading: true, error: null, newUrl: null })

    try {
      // Get any pending form changes (if user is editing)
      const formChanges = getChangedFields(form.values, profile)

      // Combine avatar removal with any pending form changes
      const updateData = {
        ...formChanges,
        profile_image: null, // null to clear the ForeignKey field
      }

      // Update profile to remove avatar + any form changes
      const updatedProfile = await userService.updateProfile(updateData)
      setProfile(updatedProfile)
      setProfileValues(updatedProfile)

      setSuccessMessage(t('user.profilePage.messages.avatarRemovedSuccess'))
      successTimeoutRef.current = delay(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage = parseApiError(err, {
        fieldNames: ['profile_image'],
        defaultMessage: t('user.profilePage.messages.failedToRemoveAvatar'),
      })
      setAvatarState((prev) => ({ ...prev, error: errorMessage }))
    } finally {
      setAvatarState((prev) => ({ ...prev, isUploading: false }))
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    navigate('/login')
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (error && !profile) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchProfile} sx={{ mt: 2 }}>
          {t('user.profilePage.messages.retry')}
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        {t('user.profilePage.title')}
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Avatar Upload Section */}
        <Box sx={{ mb: 4 }}>
          <AvatarUpload
            currentImage={
              avatarState.newUrl || profile?.profile_image?.file || profile?.image || null
            }
            userName={profile?.first_name || profile?.email || 'User'}
            onImageSelect={handleAvatarSelect}
            onImageRemove={handleAvatarRemove}
            isUploading={avatarState.isUploading}
            disabled={false}
            error={avatarState.error}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Profile Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {profile?.full_name || `${profile?.first_name} ${profile?.last_name}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('user.profilePage.memberSince')}{' '}
              {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : t('user.profilePage.notAvailable')}
            </Typography>
          </Box>
          {!isEditing && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleEdit}
              sx={{ borderColor: Colors.primary.main, color: Colors.primary.main }}
            >
              {t('user.profilePage.editProfile')}
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Profile Form */}
        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('user.profilePage.fields.username')}
                {...form.getInputProps('username')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                error={isEditing && !!form.errors.username}
                helperText={isEditing ? form.errors.username : ' '}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('user.profilePage.fields.email')}
                value={profile?.email || ''}
                disabled
                variant="filled"
                helperText={t('user.profilePage.fields.emailCannotBeChanged')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('user.profilePage.fields.firstName')}
                {...form.getInputProps('first_name')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                error={isEditing && !!form.errors.first_name}
                helperText={isEditing ? form.errors.first_name : ' '}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('user.profilePage.fields.lastName')}
                {...form.getInputProps('last_name')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                error={isEditing && !!form.errors.last_name}
                helperText={isEditing ? form.errors.last_name : ' '}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('user.profilePage.fields.mobile')}
                {...form.getInputProps('mobile')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                placeholder={t('user.profilePage.fields.mobilePlaceholder')}
                error={isEditing && !!form.errors.mobile}
                helperText={isEditing ? form.errors.mobile : ' '}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                select
                label={t('user.profilePage.fields.gender')}
                {...form.getInputProps('gender')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                error={isEditing && !!form.errors.gender}
                helperText={isEditing ? form.errors.gender : ' '}
              >
                <MenuItem value="Male">{t('user.profilePage.fields.genderMale')}</MenuItem>
                <MenuItem value="Female">{t('user.profilePage.fields.genderFemale')}</MenuItem>
                <MenuItem value="Other">{t('user.profilePage.fields.genderOther')}</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('user.profilePage.fields.role')}
                value={profile?.role || 'customer'}
                disabled
                variant="filled"
                helperText={t('user.profilePage.fields.roleHelperText')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={t('user.profilePage.fields.accountStatus')}
                value={
                  profile?.is_active
                    ? t('user.profilePage.fields.statusActive')
                    : t('user.profilePage.fields.statusInactive')
                }
                disabled
                variant="filled"
                helperText=" "
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          {isEditing && (
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                type="button"
                disabled={isSaving}
              >
                {t('user.profilePage.cancel')}
              </Button>
              <Button
                variant="contained"
                startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                type="submit"
                disabled={isSaving}
                sx={{
                  background: Colors.gradient.purpleViolet,
                  '&:hover': {
                    background: Colors.gradient.blueIndigo,
                  },
                }}
              >
                {isSaving ? t('user.profilePage.saving') : t('user.profilePage.saveChanges')}
              </Button>
            </Box>
          )}
        </form>
      </Paper>

      {/* Support Button - Visible on mobile */}
      <Box sx={{ mt: 3, display: { xs: 'block', md: 'none' } }}>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          startIcon={<HelpOutline />}
          onClick={() => navigate('/support/tickets')}
          sx={{
            py: 1.5,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              backgroundColor: 'primary.main',
              color: 'white',
            },
          }}
        >
          {t('user.profilePage.buttons.supportAndHelp')}
        </Button>
      </Box>

      {/* Logout Button - Visible on mobile */}
      <Box sx={{ mt: 2, display: { xs: 'block', md: 'none' } }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{
            py: 1.5,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              backgroundColor: 'error.main',
              color: 'white',
            },
          }}
        >
          {t('user.profilePage.buttons.logout')}
        </Button>
      </Box>
    </Container>
  )
}

export default ProfilePage
