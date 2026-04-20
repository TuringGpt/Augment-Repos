import { Container, Typography, Box, Alert } from '@mui/material'
import { Email as EmailIcon, Construction as ConstructionIcon } from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'

/**
 * AdminNewslettersPage Component
 * Admin page for managing newsletter subscriptions
 * Currently displays a work in progress banner
 */
const AdminNewslettersPage = () => {
  const { t } = useTranslation()
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Work In Progress Banner */}
      <Alert
        severity="info"
        icon={<ConstructionIcon />}
        sx={{
          mb: 3,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(2, 136, 209, 0.15)'
              : 'rgba(3, 169, 244, 0.1)',
          borderLeft: 4,
          borderColor: 'info.main',
          '& .MuiAlert-icon': {
            fontSize: 28,
          },
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          🚧 {t('admin.newslettersPage.workInProgress')}
        </Typography>
        <Typography variant="body2">
          {t('admin.newslettersPage.underDevelopment')}
        </Typography>
      </Alert>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <EmailIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('admin.newslettersPage.title')}
          </Typography>
        </Box>
        <Typography color="text.secondary">
          {t('admin.newslettersPage.subtitle')}
        </Typography>
      </Box>
    </Container>
  )
}

export default AdminNewslettersPage
