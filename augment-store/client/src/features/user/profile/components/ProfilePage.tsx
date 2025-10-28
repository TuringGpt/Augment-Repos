import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  TextField,
  Button,
  Grid,
  MenuItem,
} from '@mui/material'
import { useForm } from '@mantine/form'
import { Edit, Save, Cancel } from '@mui/icons-material'
import { userService } from '@services/api/user/userService'
import type { UserProfile, UpdateProfileRequest } from '@features/user/types'
import { Colors } from '@config/colors'

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Mantine form with validation
  const form = useForm<UpdateProfileRequest>({
    initialValues: {
      username: '',
      first_name: '',
      last_name: '',
      mobile: '',
      gender: undefined,
    },
    validate: {
      username: (value) => {
        if (!value || value.trim() === '') return 'Username is required'
        if (value.trim().length < 3) return 'Username must be at least 3 characters'
        if (value.trim().length > 150) return 'Username must be less than 150 characters'
        return null
      },
      first_name: (value) => {
        if (!value || value.trim() === '') return 'First name is required'
        if (value.trim().length < 2) return 'First name must be at least 2 characters'
        if (value.trim().length > 150) return 'First name must be less than 150 characters'
        return null
      },
      last_name: (value) => {
        if (!value || value.trim() === '') return 'Last name is required'
        if (value.trim().length < 2) return 'Last name must be at least 2 characters'
        if (value.trim().length > 150) return 'Last name must be less than 150 characters'
        return null
      },
      mobile: (value) => {
        if (value && value.trim() !== '' && value.length > 20) {
          return 'Mobile number must be less than 20 characters'
        }
        return null
      },
    },
  })

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const profileData = await userService.getProfile()
      setProfile(profileData)

      // Set form values
      form.setValues({
        username: profileData.username || '',
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        mobile: profileData.mobile || '',
        gender: profileData.gender || undefined,
      })
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
    form.reset()

    // Reset form to current profile data
    if (profile) {
      form.setValues({
        username: profile.username || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        mobile: profile.mobile || '',
        gender: profile.gender || undefined,
      })
    }
  }

  const handleSave = form.onSubmit(async (values) => {
    try {
      setError(null)
      setSuccessMessage(null)

      // Only send fields that have changed and are not empty
      const updateData: UpdateProfileRequest = {}

      if (values.username && values.username !== (profile?.username || '')) {
        updateData.username = values.username
      }
      if (values.first_name && values.first_name !== (profile?.first_name || '')) {
        updateData.first_name = values.first_name
      }
      if (values.last_name && values.last_name !== (profile?.last_name || '')) {
        updateData.last_name = values.last_name
      }
      if (values.mobile && values.mobile !== (profile?.mobile || '')) {
        updateData.mobile = values.mobile
      }
      if (values.gender && values.gender !== (profile?.gender || '')) {
        updateData.gender = values.gender
      }

      // Check if there are any changes to send
      if (Object.keys(updateData).length === 0) {
        setError('No changes to save')
        return
      }

      const updatedProfile = await userService.updateProfile(updateData)
      setProfile(updatedProfile)

      // Update form with new profile data
      form.setValues({
        username: updatedProfile.username || '',
        first_name: updatedProfile.first_name || '',
        last_name: updatedProfile.last_name || '',
        mobile: updatedProfile.mobile || '',
        gender: updatedProfile.gender || undefined,
      })

      setIsEditing(false)
      setSuccessMessage('Profile updated successfully!')

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string }).response?.data
          ?.message ||
        (err as { message?: string }).message ||
        'Failed to update profile'
      setError(errorMessage)
    }
  })

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
        {/* Profile Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: Colors.primary.main,
              fontSize: '2rem',
              mr: 3,
            }}
          >
            {profile?.first_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
          </Avatar>
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
                label="Username"
                {...form.getInputProps('username')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                error={isEditing && !!form.errors.username}
                helperText={isEditing ? form.errors.username : ''}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
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
                label="First Name"
                {...form.getInputProps('first_name')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                error={isEditing && !!form.errors.first_name}
                helperText={isEditing ? form.errors.first_name : ''}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                {...form.getInputProps('last_name')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                error={isEditing && !!form.errors.last_name}
                helperText={isEditing ? form.errors.last_name : ''}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile"
                {...form.getInputProps('mobile')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                placeholder="+1234567890"
                error={isEditing && !!form.errors.mobile}
                helperText={isEditing ? form.errors.mobile : ''}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                {...form.getInputProps('gender')}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
                error={isEditing && !!form.errors.gender}
                helperText={isEditing ? form.errors.gender : ''}
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
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
                label="Account Status"
                value={profile?.is_active ? 'Active' : 'Inactive'}
                disabled
                variant="filled"
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
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                type="submit"
                sx={{
                  background: Colors.gradient.purpleViolet,
                  '&:hover': {
                    background: Colors.gradient.blueIndigo,
                  },
                }}
              >
                Save Changes
              </Button>
            </Box>
          )}
        </form>
      </Paper>
    </Container>
  )
}

export default ProfilePage
