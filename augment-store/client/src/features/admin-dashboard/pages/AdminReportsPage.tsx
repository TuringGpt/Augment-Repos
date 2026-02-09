import { useEffect, useRef } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useAdminReportsStore } from '@store/adminReportsStore'
import { GeneralStatisticsChart, HealthCheckCard } from '@features/admin-reports/components'

/**
 * AdminReportsPage Component
 * Admin page for viewing reports with general statistics
 *
 * Note: Authentication and admin role checks are handled by the AdminRoute guard.
 * This component will only render for authenticated admin users.
 */
const AdminReportsPage = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()
  const {
    generalStatistics,
    isLoading,
    error,
    fetchGeneralStatistics,
    clearError,
    healthCheck,
    isHealthCheckLoading,
    healthCheckError,
    fetchHealthCheck,
    clearHealthCheckError,
  } = useAdminReportsStore()

  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)
  const healthCheckAbortControllerRef = useRef<AbortController | null>(null)

  // Load general statistics and health check on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadGeneralStatistics()
      loadHealthCheck()
    }

    // Cleanup function to abort requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (healthCheckAbortControllerRef.current) {
        healthCheckAbortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role])

  const loadGeneralStatistics = () => {
    // Clear any stale error from previous visits to prevent brief flash of old error
    clearError()

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    // Fetch general statistics
    fetchGeneralStatistics(abortControllerRef.current.signal)
  }

  const loadHealthCheck = () => {
    // Clear any stale error from previous visits to prevent brief flash of old error
    clearHealthCheckError()

    // Abort any existing request
    if (healthCheckAbortControllerRef.current) {
      healthCheckAbortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    healthCheckAbortControllerRef.current = new AbortController()

    // Fetch health check
    fetchHealthCheck(healthCheckAbortControllerRef.current.signal)
  }

  const handleRefresh = () => {
    clearError()
    clearHealthCheckError()
    loadGeneralStatistics()
    loadHealthCheck()
  }

  const handleRetry = () => {
    clearError()
    loadGeneralStatistics()
  }

  const handleHealthCheckRetry = () => {
    clearHealthCheckError()
    loadHealthCheck()
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('admin.reportsPage.title')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={isLoading || isHealthCheckLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading || isHealthCheckLoading}
          >
            {t('admin.dashboard.refresh')}
          </Button>
        </Box>
        <Typography color="text.secondary">
          {t('admin.reportsPage.subtitle')}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              {t('admin.dashboard.tryAgain')}
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Health Check and General Statistics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <HealthCheckCard
            data={healthCheck}
            isLoading={isHealthCheckLoading}
            error={healthCheckError}
            onRetry={handleHealthCheckRetry}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <GeneralStatisticsChart data={generalStatistics} isLoading={isLoading} />
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdminReportsPage

