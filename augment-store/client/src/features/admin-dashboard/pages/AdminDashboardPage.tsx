import { useState } from 'react'
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
import { useAuthStore } from '@store/authStore'
import { useAdminDashboard } from '@features/admin-dashboard/hooks'
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
  const { user, isAuthenticated } = useAuthStore()
  const [days, setDays] = useState(30)
  const { analytics, isLoading, error, refetch } = useAdminDashboard({ days })

  // Check if user is authenticated and is an admin
  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please log in to access the admin dashboard.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Container>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Access denied. You do not have permission to view the admin dashboard.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go to Home
        </Button>
      </Container>
    )
  }

  const handleDaysChange = (newDays: number) => {
    setDays(newDays)
  }

  const handleRefresh = () => {
    refetch()
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Error Loading Analytics
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={refetch}
            sx={{ mt: 1 }}
          >
            Try Again
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
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analytics overview and performance metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select value={days} label="Period" onChange={(e) => handleDaysChange(Number(e.target.value))}>
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
              <MenuItem value={365}>Last year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
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
                title="Total Revenue"
                value={`$${analytics.overview.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={<AttachMoneyIcon />}
                color="success.main"
                subtitle={`Avg Order: $${analytics.overview.average_order_value.toFixed(2)}`}
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Orders"
                value={analytics.overview.total_orders.toLocaleString()}
                icon={<ShoppingCartIcon />}
                color="primary.main"
                subtitle={`${analytics.overview.completed_orders} completed`}
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="New Customers"
                value={analytics.overview.new_customers.toLocaleString()}
                icon={<PeopleIcon />}
                color="info.main"
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Products"
                value={analytics.overview.total_products.toLocaleString()}
                icon={<InventoryIcon />}
                color="warning.main"
                subtitle={`${analytics.overview.total_categories} categories`}
                isLoading={isLoading}
              />
            </Grid>
          </Grid>

          {/* Additional Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Completed Orders"
                value={analytics.overview.completed_orders.toLocaleString()}
                icon={<CheckCircleIcon />}
                color="success.main"
                subtitle={`${analytics.overview.total_orders > 0 ? ((analytics.overview.completed_orders / analytics.overview.total_orders) * 100).toFixed(1) : '0.0'}% completion rate`}
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Cart Abandonment Rate"
                value={`${analytics.cart_abandonment.abandonment_rate.toFixed(1)}%`}
                icon={<ShoppingCartIcon />}
                color="error.main"
                subtitle={`${analytics.cart_abandonment.total_abandonments} abandonments`}
                isLoading={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Overall Conversion"
                value={`${analytics.conversion_funnel.overall_conversion_rate.toFixed(2)}%`}
                icon={<TrendingUpIcon />}
                color="primary.main"
                subtitle="View to purchase"
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

