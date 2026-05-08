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
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'

/**
 * AdminAccountsPage Component
 * Admin page for managing user accounts
 *
 * Note: This component uses defense-in-depth for access control:
 * 1. Primary enforcement: AdminRoute guard redirects non-admin users to home
 * 2. Secondary enforcement: Component-level checks render login/access-denied states
 *    (These provide graceful fallback UI in case the component is rendered outside the guard)
 */
const AdminAccountsPage = () => {
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

  if (user?.role !== 'admin') {
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
          <AccountCircleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('admin.accountsPage.title')}
          </Typography>
        </Box>
        <Typography color="text.secondary">
          {t('admin.accountsPage.subtitle')}
        </Typography>
      </Box>

      {/* Work in Progress Content */}
      <Paper
        sx={{
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          textAlign: 'center',
        }}
      >
        <AccountCircleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3, opacity: 0.5 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
          {t('admin.accountsPage.workInProgress')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
          {t('admin.accountsPage.underDevelopment')}
        </Typography>
      </Paper>
    </Container>
  )
}

export default AdminAccountsPage
