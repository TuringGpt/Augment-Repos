import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Alert,
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
import CustomerSegmentsChart from '@features/admin-dashboard/components/CustomerSegmentsChart'
import NewVsReturningChart from '@features/admin-dashboard/components/NewVsReturningChart'

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
    customerSegments,
    isCustomerSegmentsLoading,
    customerSegmentsError,
    fetchCustomerSegments,
    clearCustomerSegmentsError,
    newVsReturning,
    isNewVsReturningLoading,
    newVsReturningError,
    fetchNewVsReturning,
    clearNewVsReturningError,
  } = useCustomerStatisticsStore()

  const [days, setDays] = useState(365)
  const abortControllerRef = useRef<AbortController | null>(null)
  const segmentsAbortControllerRef = useRef<AbortController | null>(null)
  const newVsReturningAbortControllerRef = useRef<AbortController | null>(null)

  // Load customer retention, segments, and new vs returning data on mount and when days changes
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadCustomerRetention()
      loadCustomerSegments()
      loadNewVsReturning()
    }

    // Cleanup function to abort requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (segmentsAbortControllerRef.current) {
        segmentsAbortControllerRef.current.abort()
      }
      if (newVsReturningAbortControllerRef.current) {
        newVsReturningAbortControllerRef.current.abort()
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

    // fetchCustomerRetention handles all errors internally and doesn't rethrow
    fetchCustomerRetention({ days }, abortControllerRef.current.signal)
  }

  const loadCustomerSegments = () => {
    // Cancel any pending request
    if (segmentsAbortControllerRef.current) {
      segmentsAbortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    segmentsAbortControllerRef.current = new AbortController()

    // fetchCustomerSegments handles all errors internally and doesn't rethrow
    fetchCustomerSegments({ days }, segmentsAbortControllerRef.current.signal)
  }

  const loadNewVsReturning = () => {
    // Cancel any pending request
    if (newVsReturningAbortControllerRef.current) {
      newVsReturningAbortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    newVsReturningAbortControllerRef.current = new AbortController()

    // fetchNewVsReturning handles all errors internally and doesn't rethrow
    fetchNewVsReturning({ days }, newVsReturningAbortControllerRef.current.signal)
  }

  const handleDaysChange = (newDays: number) => {
    setDays(newDays)
  }

  const handleRefresh = () => {
    loadCustomerRetention()
    loadCustomerSegments()
    loadNewVsReturning()
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
            disabled={isCustomerRetentionLoading || isCustomerSegmentsLoading || isNewVsReturningLoading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alerts */}
      {customerRetentionError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearCustomerRetentionError}>
          {customerRetentionError}
        </Alert>
      )}
      {customerSegmentsError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearCustomerSegmentsError}>
          {customerSegmentsError}
        </Alert>
      )}
      {newVsReturningError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearNewVsReturningError}>
          {newVsReturningError}
        </Alert>
      )}

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Customer Retention Chart */}
        <Grid item xs={12}>
          <CustomerRetentionChart
            data={customerRetention}
            isLoading={isCustomerRetentionLoading}
          />
        </Grid>

        {/* New vs Returning Customers Chart */}
        <Grid item xs={12} md={6}>
          <NewVsReturningChart
            data={newVsReturning}
            isLoading={isNewVsReturningLoading}
          />
        </Grid>

        {/* Customer Segments Chart */}
        <Grid item xs={12} md={6}>
          <CustomerSegmentsChart
            data={customerSegments}
            isLoading={isCustomerSegmentsLoading}
          />
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdminUsersPage

