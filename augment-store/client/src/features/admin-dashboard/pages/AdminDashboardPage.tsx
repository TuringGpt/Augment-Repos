import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore, useAdminDashboardStore } from '@store/index'
import MetricCard from '@features/admin-dashboard/components/MetricCard'
import ConversionFunnelChart from '@features/admin-dashboard/components/ConversionFunnelChart'
import TopProductsTable from '@features/admin-dashboard/components/TopProductsTable'
import CategoryPerformanceChart from '@features/admin-dashboard/components/CategoryPerformanceChart'

/**
 * AdminDashboardPage Component
 * Main admin dashboard page with analytics overview and visualizations
 */
const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()
  const { analytics, days, isLoading, error, fetchAnalytics, setDays } = useAdminDashboardStore()

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)
  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch analytics on mount and when days changes
  useEffect(() => {
    // Cancel any in-flight request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Fetch analytics
    fetchAnalytics(days, abortController.signal).catch((err) => {
      // Ignore abort errors - these are expected when component unmounts or days changes
      const error = err as { name?: string }
      if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
        return
      }
      // Other errors are already handled in the store
      console.error('Error fetching analytics:', err)
    })

    // Cleanup: abort in-flight requests when dependencies change or component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [days, fetchAnalytics])

  // Track mounted state - only runs on mount and unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

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

  const handleDaysChange = (newDays: number) => {
    setDays(newDays)
  }

  const handleRefresh = () => {
    fetchAnalytics(days).catch((err) => {
      // Error is already handled in the store
      console.error('Error refreshing analytics:', err)
    })
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {t('admin.dashboard.errorLoadingAnalytics')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRefresh}
            sx={{ mt: 1 }}
          >
            {t('admin.dashboard.tryAgain')}
          </Button>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('admin.dashboard.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('admin.dashboard.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.dashboard.period')}</InputLabel>
            <Select value={days} label={t('admin.dashboard.period')} onChange={(e) => handleDaysChange(Number(e.target.value))}>
              <MenuItem value={7}>{t('admin.dashboard.last7Days')}</MenuItem>
              <MenuItem value={30}>{t('admin.dashboard.last30Days')}</MenuItem>
              <MenuItem value={90}>{t('admin.dashboard.last90Days')}</MenuItem>
              <MenuItem value={365}>{t('admin.dashboard.lastYear')}</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {t('admin.dashboard.refresh')}
          </Button>
        </Box>
      </Box>

      {isLoading && !analytics ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : analytics ? (
        <>
          {/* Overview Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title={t('admin.dashboard.metrics.totalRevenue')}
                value={`$${analytics.overview.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={<AttachMoneyIcon />}
                color="success.main"
                subtitle={`${t('admin.dashboard.metrics.avgOrder')}: $${analytics.overview.average_order_value.toFixed(2)}`}
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title={t('admin.dashboard.metrics.totalOrders')}
                value={analytics.overview.total_orders.toLocaleString()}
                icon={<ShoppingCartIcon />}
                color="primary.main"
                subtitle={`${analytics.overview.completed_orders} ${t('admin.dashboard.metrics.completed')}`}
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title={t('admin.dashboard.metrics.newCustomers')}
                value={analytics.overview.new_customers.toLocaleString()}
                icon={<PeopleIcon />}
                color="info.main"
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title={t('admin.dashboard.metrics.totalProducts')}
                value={analytics.overview.total_products.toLocaleString()}
                icon={<InventoryIcon />}
                color="warning.main"
                subtitle={`${analytics.overview.total_categories} ${t('admin.dashboard.metrics.categories')}`}
                isLoading={isLoading}
              />
            </Grid>
          </Grid>

          {/* Additional Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title={t('admin.dashboard.metrics.completedOrders')}
                value={analytics.overview.completed_orders.toLocaleString()}
                icon={<CheckCircleIcon />}
                color="success.main"
                subtitle={`${analytics.overview.total_orders > 0 ? ((analytics.overview.completed_orders / analytics.overview.total_orders) * 100).toFixed(1) : '0.0'}% ${t('admin.dashboard.metrics.completionRate')}`}
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title={t('admin.dashboard.metrics.cartAbandonmentRate')}
                value={`${analytics.cart_abandonment.abandonment_rate.toFixed(1)}%`}
                icon={<ShoppingCartIcon />}
                color="error.main"
                subtitle={`${analytics.cart_abandonment.total_abandonments} ${t('admin.dashboard.metrics.abandonments')}`}
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title={t('admin.dashboard.metrics.overallConversion')}
                value={`${analytics.conversion_funnel.overall_conversion_rate.toFixed(2)}%`}
                icon={<TrendingUpIcon />}
                color="primary.main"
                subtitle={t('admin.dashboard.metrics.viewToPurchase')}
                isLoading={isLoading}
              />
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <ConversionFunnelChart
                data={analytics.conversion_funnel}
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CategoryPerformanceChart
                data={analytics.category_performance}
                isLoading={isLoading}
              />
            </Grid>
          </Grid>

          {/* Top Products Table */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TopProductsTable
                data={analytics.top_products_by_revenue}
                isLoading={isLoading}
              />
            </Grid>
          </Grid>
        </>
      ) : null}
    </Container>
  )
}

export default AdminDashboardPage

