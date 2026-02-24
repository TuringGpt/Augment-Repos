import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'

/**
 * AdminSettingsPage Component
 * Admin page for managing application settings
 * Currently showing work in progress placeholder
 *
 * Note: This component uses defense-in-depth for access control:
 * 1. Primary enforcement: AdminRoute guard redirects non-admin users to home
 * 2. Secondary enforcement: Component-level checks render login/access-denied states
 *    (These provide graceful fallback UI in case the component is rendered outside the guard)
 */
const AdminSettingsPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()

  // Wait for persisted state to rehydrate before checking auth state
  // This prevents showing misleading "please login" or "access denied" UI
  // during the brief hydration period on initial page load
  if (!hasHydrated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  // Check if user is authenticated and is an admin
  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('admin.dashboard.pleaseLogin')}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          {t('admin.dashboard.goToLogin')}
        </Button>
      </Container>
    )
  }

  // Handle transient state where isAuthenticated is true but user is still null
  // (e.g., during user profile fetch or corrupted persisted state)
  // Show loading state instead of misleading "access denied" message
  if (!user) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (user.role !== 'admin') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('admin.dashboard.accessDenied')}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('admin.dashboard.goToHome')}
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('admin.settingsPage.title')}
          </Typography>
        </Box>
        <Typography color="text.secondary">
          {t('admin.settingsPage.subtitle')}
        </Typography>
      </Box>

      {/* Work in Progress Content */}
      <Paper
        sx={{
          p: 6,
          textAlign: 'center',
          bgcolor: 'background.default',
          border: '2px dashed',
          borderColor: 'divider',
        }}
      >
        <ConstructionIcon
          sx={{
            fontSize: 80,
            color: 'warning.main',
            mb: 3,
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          {t('admin.settingsPage.workInProgress')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
          {t('admin.settingsPage.underDevelopment')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('admin.settingsPage.checkBackSoon')}
        </Typography>
      </Paper>
    </Container>
  )
}

export default AdminSettingsPage

