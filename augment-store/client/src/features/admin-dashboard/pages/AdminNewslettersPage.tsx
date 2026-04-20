import { Container, Typography, Box, Alert } from '@mui/material'
import { Email as EmailIcon, Construction as ConstructionIcon } from '@mui/icons-material'

/**
 * AdminNewslettersPage Component
 * Admin page for managing newsletter subscriptions
 * Currently displays a work in progress banner
 */
const AdminNewslettersPage = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Work In Progress Banner */}
      <Alert
        severity="info"
        icon={<ConstructionIcon />}
        sx={{
          mb: 3,
          backgroundColor: 'info.lighter',
          borderLeft: 4,
          borderColor: 'info.main',
          '& .MuiAlert-icon': {
            fontSize: 28,
          },
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          🚧 Work In Progress
        </Typography>
        <Typography variant="body2">
          This page is currently under development. Some features may not be fully functional yet.
        </Typography>
      </Alert>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <EmailIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Newsletter Subscriptions
          </Typography>
        </Box>
        <Typography color="text.secondary">
          Manage all newsletter subscriptions from users
        </Typography>
      </Box>
    </Container>
  )
}

export default AdminNewslettersPage
