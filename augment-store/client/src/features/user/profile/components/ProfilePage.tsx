import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Divider,
  Avatar,
} from '@mui/material'
import { Person, Edit, Save, Cancel } from '@mui/icons-material'
import { userService } from '@services/api/user/userService'
import { useAuthStore } from '@store/authStore'
import type { UserProfile, UpdateProfileRequest } from '@features/user/types'
import { Colors } from '@config/colors'

const ProfilePage = () => {
  const { user: authUser } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    mobile: '',
    gender: '' as 'Male' | 'Female' | 'Other' | '',
  })

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const profileData = await userService.getProfile()
      setProfile(profileData)
      setFormData({
        username: profileData.username || '',
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        mobile: profileData.mobile || '',
        gender: profileData.gender || '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
      setFormData({
        username: profile.username || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        mobile: profile.mobile || '',
        gender: profile.gender || '',
      })
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Only send fields that have changed and are not empty
      const updateData: UpdateProfileRequest = {}

      if (formData.username && formData.username !== (profile?.username || '')) {
        updateData.username = formData.username
      }
      if (formData.first_name && formData.first_name !== (profile?.first_name || '')) {
        updateData.first_name = formData.first_name
      }
      if (formData.last_name && formData.last_name !== (profile?.last_name || '')) {
        updateData.last_name = formData.last_name
      }
      if (formData.mobile && formData.mobile !== (profile?.mobile || '')) {
        updateData.mobile = formData.mobile
      }
      if (formData.gender && formData.gender !== (profile?.gender || '')) {
        updateData.gender = formData.gender
      }

      // Check if there are any changes to send
      if (Object.keys(updateData).length === 0) {
        setError('No changes to save')
        setIsSaving(false)
        return
      }

      const updatedProfile = await userService.updateProfile(updateData)
      setProfile(updatedProfile)
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
    } finally {
      setIsSaving(false)
    }
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
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
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
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
              placeholder="+1234567890"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              disabled={!isEditing}
              variant={isEditing ? 'outlined' : 'filled'}
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
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={isSaving}
              sx={{
                background: Colors.gradient.purpleViolet,
                '&:hover': {
                  background: Colors.gradient.blueIndigo,
                },
              }}
            >
              {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  )
}

export default ProfilePage
