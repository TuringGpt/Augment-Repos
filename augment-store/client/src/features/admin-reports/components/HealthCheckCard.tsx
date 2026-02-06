import { Paper, Typography, Box, CircularProgress, Alert, Button } from '@mui/material'
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import type { HealthCheckResponse } from '@features/admin-reports/types'

interface HealthCheckCardProps {
  data: HealthCheckResponse | null
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}

/**
 * HealthCheckCard Component
 * Displays the API health check status
 */
const HealthCheckCard = ({ data, isLoading = false, error = null, onRetry }: HealthCheckCardProps) => {
  const { t } = useTranslation()

  const isHealthy = data?.status === 'ok'

  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        opacity: isLoading ? 0.6 : 1,
        transition: 'opacity 0.3s',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {t('admin.reportsPage.healthCheck.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('admin.reportsPage.healthCheck.subtitle')}
      </Typography>

      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('admin.reportsPage.healthCheck.checking')}
          </Typography>
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                {t('admin.dashboard.tryAgain')}
              </Button>
            )
          }
        >
          {error}
        </Alert>
      ) : data ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          {isHealthy ? (
            <>
              <CheckCircleIcon
                sx={{
                  fontSize: 64,
                  color: 'success.main',
                  mb: 2,
                }}
              />
              <Typography variant="h5" fontWeight={700} color="success.main" gutterBottom>
                {t('admin.reportsPage.healthCheck.healthy')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.reportsPage.healthCheck.allSystemsOperational')}
              </Typography>
            </>
          ) : (
            <>
              <ErrorIcon
                sx={{
                  fontSize: 64,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              <Typography variant="h5" fontWeight={700} color="error.main" gutterBottom>
                {t('admin.reportsPage.healthCheck.unhealthy')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.reportsPage.healthCheck.systemIssuesDetected')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {t('admin.reportsPage.healthCheck.status')}: {data.status}
              </Typography>
            </>
          )}
        </Box>
      ) : null}
    </Paper>
  )
}

export default HealthCheckCard

