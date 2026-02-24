import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
} from '@mui/material'
import {
  ConfirmationNumber as TicketIcon,
  AccessTime as AccessTimeIcon,
  Flag as StatusIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Error as UrgentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'

// Dummy stats data
const DUMMY_STATS = {
  totalTickets: 156,
  openTickets: 42,
  inProgressTickets: 28,
  resolvedTickets: 86,
  urgentTickets: 8,
  avgResponseTime: '2.5 hours',
}

/**
 * AdminTicketsPage Component
 * Admin page for viewing ticket statistics
 *
 * Note: This component uses defense-in-depth for access control:
 * 1. Primary enforcement: AdminRoute guard redirects non-admin users to home
 * 2. Secondary enforcement: Component-level checks render login/access-denied states
 *    (These provide graceful fallback UI in case the component is rendered outside the guard)
 */
const AdminTicketsPage = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated, hasHydrated, isLoading: authLoading } = useAuthStore()

  // Wait for persisted state to rehydrate before checking auth state
  if (!hasHydrated || authLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    )
  }

  // Check if user is authenticated and is an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography color="error">Access Denied</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <TicketIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('admin.ticketsPage.title')}
          </Typography>
        </Box>
        <Typography color="text.secondary">
          {t('admin.ticketsPage.subtitle')}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Tickets */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.totalTickets')}
                </Typography>
                <TicketIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {DUMMY_STATS.totalTickets}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" color="success.main">
                  +12% {t('admin.ticketsPage.stats.fromLastMonth')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Open Tickets */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.openTickets')}
                </Typography>
                <PendingIcon sx={{ color: 'info.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {DUMMY_STATS.openTickets}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('admin.ticketsPage.stats.needsAttention')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* In Progress */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.inProgress')}
                </Typography>
                <StatusIcon sx={{ color: 'warning.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {DUMMY_STATS.inProgressTickets}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('admin.ticketsPage.stats.beingWorkedOn')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Resolved */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.resolved')}
                </Typography>
                <ResolvedIcon sx={{ color: 'success.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {DUMMY_STATS.resolvedTickets}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('admin.ticketsPage.stats.thisMonth')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Urgent Tickets */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.urgent')}
                </Typography>
                <UrgentIcon sx={{ color: 'error.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {DUMMY_STATS.urgentTickets}
              </Typography>
              <Typography variant="caption" color="error.main">
                {t('admin.ticketsPage.stats.requiresImmediate')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Avg Response Time */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.avgResponseTime')}
                </Typography>
                <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {DUMMY_STATS.avgResponseTime}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', transform: 'rotate(180deg)' }} />
                <Typography variant="caption" color="success.main">
                  -15% {t('admin.ticketsPage.stats.faster')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdminTicketsPage
