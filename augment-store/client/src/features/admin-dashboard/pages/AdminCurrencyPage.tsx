import {
  Container,
  Typography,
  Box,
  Alert,
} from '@mui/material'
import {
  AttachMoney as CurrencyIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'

/**
 * AdminCurrencyPage Component
 * Admin page for managing currencies
 * Currently in work-in-progress state
 */
const AdminCurrencyPage = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()

  // Check if user is authenticated and is an admin
  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('admin.dashboard.pleaseLogin')}
        </Alert>
      </Container>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('admin.dashboard.accessDenied')}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          {t('admin.currencyPage.title', 'Currency Management')}
        </Typography>
        <Typography color="text.secondary">
          {t('admin.currencyPage.subtitle', 'View and manage supported currencies')}
        </Typography>
      </Box>

      {/* Work in Progress Banner */}
      <Alert
        severity="info"
        icon={<CurrencyIcon />}
        sx={{
          borderRadius: 2,
          fontSize: '1rem',
          fontWeight: 500,
        }}
      >
        {t('admin.currencyPage.wipBanner', 'This page is currently under development. Full currency management features will be available soon.')}
      </Alert>
    </Container>
  )
}

export default AdminCurrencyPage

