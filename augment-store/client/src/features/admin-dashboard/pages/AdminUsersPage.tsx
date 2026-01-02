import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore, useCustomerStatisticsStore } from '@store/index'
import CustomerRetentionChart from '@features/admin-dashboard/components/CustomerRetentionChart'

/**
 * AdminUsersPage Component
 * Admin page for viewing customer statistics and retention metrics
 */
const AdminUsersPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()
  const {
    customerRetention,
    isCustomerRetentionLoading,
    customerRetentionError,
    fetchCustomerRetention,
    clearCustomerRetentionError,
  } = useCustomerStatisticsStore()

  const [days, setDays] = useState(365)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load customer retention data on mount and when days changes
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadCustomerRetention()
    }

    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role, days])

  const loadCustomerRetention = () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    fetchCustomerRetention({ days }, abortControllerRef.current.signal).catch((err) => {
      // Error is already handled in the store
      console.error('Error loading customer retention:', err)
    })
  }

  const handleDaysChange = (newDays: number) => {
    setDays(newDays)
  }

  const handleRefresh = () => {
    loadCustomerRetention()
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Customer Statistics
          </Typography>
          <Typography color="text.secondary">
            View customer retention metrics and cohort analysis
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={days}
              label="Time Period"
              onChange={(e) => handleDaysChange(Number(e.target.value))}
            >
              <MenuItem value={30}>Last 30 Days</MenuItem>
              <MenuItem value={90}>Last 90 Days</MenuItem>
              <MenuItem value={180}>Last 6 Months</MenuItem>
              <MenuItem value={365}>Last Year</MenuItem>
              <MenuItem value={730}>Last 2 Years</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isCustomerRetentionLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {customerRetentionError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearCustomerRetentionError}>
          {customerRetentionError}
        </Alert>
      )}

      {/* Loading State */}
      {isCustomerRetentionLoading && !customerRetention ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : customerRetention ? (
        <>
          {/* Customer Retention Chart */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <CustomerRetentionChart
                data={customerRetention}
                isLoading={isCustomerRetentionLoading}
              />
            </Grid>
          </Grid>
        </>
      ) : null}
    </Container>
  )
}

export default AdminUsersPage

