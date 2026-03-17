import { useState, useEffect, useRef } from 'react'
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Button,
  Grid,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Stack,
  alpha,
} from '@mui/material'
import {
  Edit,
  Save,
  Cancel,
  Logout,
  HelpOutline,
  Person,
  Email,
  Phone,
  Badge,
  VerifiedUser,
  CalendarToday,
} from '@mui/icons-material'
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
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: Colors.gradient.purpleViolet,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('user.profilePage.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('user.profilePage.subtitle')}
        </Typography>
      </Box>

      {/* Alerts */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: Colors.shadow.light,
          }}
        >
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: Colors.shadow.light,
          }}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Profile Card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              overflow: 'visible',
              position: 'relative',
              background: `linear-gradient(135deg, ${alpha(Colors.primary.light, 0.05)} 0%, ${alpha(Colors.secondary.light, 0.05)} 100%)`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Avatar Section */}
              <Box sx={{ mb: 3 }}>
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

              {/* User Info */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {(() => {
                    if (profile?.full_name?.trim()) {
                      return profile.full_name;
                    }
                    const firstName = profile?.first_name?.trim();
                    const lastName = profile?.last_name?.trim();
                    if (firstName && lastName) {
                      return `${firstName} ${lastName}`;
                    }
                    if (firstName || lastName) {
                      return firstName || lastName;
                    }
                    return profile?.username || profile?.email || 'User';
                  })()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {profile?.email}
                </Typography>

                {/* Role Badge */}
                <Chip
                  icon={<Badge />}
                  label={profile?.role === 'admin' ? t('user.profilePage.roleAdmin') : t('user.profilePage.roleCustomer')}
                  size="small"
                  sx={{
                    background: profile?.role === 'admin'
                      ? Colors.gradient.purpleViolet
                      : Colors.gradient.blueIndigo,
                    color: 'white',
                    fontWeight: 600,
                    mb: 2,
                  }}
                />

                {/* Account Status */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    mb: 2,
                  }}
                >
                  <VerifiedUser
                    sx={{
                      fontSize: 16,
                      color: profile?.is_active ? Colors.success.main : Colors.error.main,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: profile?.is_active ? Colors.success.main : Colors.error.main,
                      fontWeight: 600,
                    }}
                  >
                    {profile?.is_active
                      ? t('user.profilePage.fields.statusActive')
                      : t('user.profilePage.fields.statusInactive')}
                  </Typography>
                </Box>

                {/* Member Since */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                  }}
                >
                  <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {t('user.profilePage.memberSince', {
                      date: profile?.date_joined
                        ? new Date(profile.date_joined).toLocaleDateString()
                        : t('user.profilePage.notAvailable'),
                    })}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Action Buttons */}
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<HelpOutline />}
                  onClick={() => navigate('/support/tickets')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {t('user.profilePage.buttons.supportAndHelp')}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<Logout />}
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {t('user.profilePage.buttons.logout')}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Profile Form */}
        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Card Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('user.profilePage.personalInformation')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('user.profilePage.personalInformationSubtitle')}
                  </Typography>
                </Box>
                {!isEditing && (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={handleEdit}
                    sx={{
                      background: Colors.gradient.purpleViolet,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      '&:hover': {
                        background: Colors.gradient.blueIndigo,
                      },
                    }}
                  >
                    {t('user.profilePage.editProfile')}
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Profile Form */}
              <form onSubmit={handleSave}>
                <Grid container spacing={3}>
                  {/* Username */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {t('user.profilePage.fields.usernameLabel')}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      {...form.getInputProps('username')}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                      error={isEditing && !!form.errors.username}
                      helperText={isEditing ? form.errors.username : ' '}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>

                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Email sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {t('user.profilePage.fields.emailLabel')}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      value={profile?.email || ''}
                      disabled
                      variant="filled"
                      helperText={t('user.profilePage.fields.emailCannotBeChanged')}
                      sx={{
                        '& .MuiFilledInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>

                  {/* First Name */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {t('user.profilePage.fields.firstNameLabel')}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      {...form.getInputProps('first_name')}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                      error={isEditing && !!form.errors.first_name}
                      helperText={isEditing ? form.errors.first_name : ' '}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>

                  {/* Last Name */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {t('user.profilePage.fields.lastNameLabel')}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      {...form.getInputProps('last_name')}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                      error={isEditing && !!form.errors.last_name}
                      helperText={isEditing ? form.errors.last_name : ' '}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>

                  {/* Mobile */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {t('user.profilePage.fields.mobileLabel')}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      {...form.getInputProps('mobile')}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                      placeholder={t('user.profilePage.fields.mobilePlaceholder')}
                      error={isEditing && !!form.errors.mobile}
                      helperText={isEditing ? form.errors.mobile : ' '}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>

                  {/* Gender */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {t('user.profilePage.fields.genderLabel')}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      select
                      {...form.getInputProps('gender')}
                      disabled={!isEditing}
                      variant={isEditing ? 'outlined' : 'filled'}
                      error={isEditing && !!form.errors.gender}
                      helperText={isEditing ? form.errors.gender : ' '}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    >
                      <MenuItem value="Male">{t('user.profilePage.fields.genderMale')}</MenuItem>
                      <MenuItem value="Female">{t('user.profilePage.fields.genderFemale')}</MenuItem>
                      <MenuItem value="Other">{t('user.profilePage.fields.genderOther')}</MenuItem>
                    </TextField>
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
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                      }}
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
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ProfilePage
