import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  Card,
  CardContent,
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/index'

/**
 * AdminOrdersPage Component
 * Admin page for managing orders - currently showing work in progress
 */
const AdminOrdersPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()

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
          <ShoppingCartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('admin.ordersPage.title')}
          </Typography>
        </Box>
        <Typography color="text.secondary">
          {t('admin.ordersPage.subtitle')}
        </Typography>
      </Box>

      {/* Work in Progress Card */}
      <Card
        sx={{
          maxWidth: 600,
          mx: 'auto',
          mt: 8,
          textAlign: 'center',
          boxShadow: 3,
        }}
      >
        <CardContent sx={{ py: 6, px: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <ConstructionIcon
              sx={{
                fontSize: 80,
                color: 'warning.main',
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    opacity: 1,
                  },
                  '50%': {
                    opacity: 0.5,
                  },
                },
              }}
            />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            {t('admin.ordersPage.workInProgress')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('admin.ordersPage.underDevelopment')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {t('admin.ordersPage.checkBackSoon')}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  )
}

export default AdminOrdersPage

