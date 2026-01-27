import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'

/**
 * AdminReportsPage Component
 * Admin page for viewing reports - currently showing work in progress
 *
 * Note: Authentication and admin role checks are handled by the AdminRoute guard.
 * This component will only render for authenticated admin users.
 */
const AdminReportsPage = () => {
  const { t } = useTranslation()

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('admin.reportsPage.title')}
          </Typography>
        </Box>
        <Typography color="text.secondary">
          {t('admin.reportsPage.subtitle')}
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
                animation: 'adminReportsPagePulse 2s ease-in-out infinite',
                '@keyframes adminReportsPagePulse': {
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
            {t('admin.reportsPage.workInProgress')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('admin.reportsPage.underDevelopment')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {t('admin.reportsPage.checkBackSoon')}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  )
}

export default AdminReportsPage

