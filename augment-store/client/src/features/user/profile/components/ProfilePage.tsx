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
import { Edit, Save, Cancel, Logout } from '@mui/icons-material'
import delay from 'lodash/delay'
import { useNavigate } from 'react-router-dom'
import { userService } from '@services/api/user/userService'
import { storageService } from '@services/api/storage/storageService'
import { authService } from '@services/api/auth/authService'
import type { UserProfile } from '@features/user/types'
import { Colors } from '@config/colors'
import { useProfileForm } from '../hooks/useProfileForm'
import { getChangedFields } from '../utils/profileValidation'
import { AvatarUpload } from './AvatarUpload'

const ProfilePage = () => {
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
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message ||
        (err as { message?: string }).message ||
        'Failed to load profile'
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
      setSuccessMessage('Profile updated successfully!')

      // Auto-hide success message after 3 seconds
      successTimeoutRef.current = delay(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message ||
        (err as { message?: string }).message ||
        'Failed to update profile'
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

      setSuccessMessage('Avatar updated successfully!')
      successTimeoutRef.current = delay(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message ||
        (err as { message?: string }).message ||
        'Failed to upload avatar'
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

      setSuccessMessage('Avatar removed successfully!')
      successTimeoutRef.current = delay(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message ||
        (err as { message?: string }).message ||
        'Failed to remove avatar'
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
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error && !profile) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchProfile} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        My Profile
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
              Member since{' '}
              {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>
          {!isEditing && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleEdit}
              sx={{ borderColor: Colors.primary.main, color: Colors.primary.main }}
            >
              Edit Profile
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
                label="Username"
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
                label="Email"
                value={profile?.email || ''}
                disabled
                variant="filled"
                helperText="Email cannot be changed"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="First Name"
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
                label="Last Name"
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
                label="Mobile"
                {...form.getInputProps('mobile')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                placeholder="+1234567890"
                error={isEditing && !!form.errors.mobile}
                helperText={isEditing ? form.errors.mobile : ' '}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Gender"
                {...form.getInputProps('gender')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                error={isEditing && !!form.errors.gender}
                helperText={isEditing ? form.errors.gender : ' '}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Role"
                value={profile?.role || 'customer'}
                disabled
                variant="filled"
                helperText="Role is managed by administrators"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Account Status"
                value={profile?.is_active ? 'Active' : 'Inactive'}
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
                Cancel
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
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </form>
      </Paper>

      {/* Logout Button - Visible on mobile */}
      <Box sx={{ mt: 3, display: { xs: 'block', md: 'none' } }}>
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
          Logout
        </Button>
      </Box>
    </Container>
  )
}

export default ProfilePage
