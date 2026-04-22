import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Alert,
  Button,
  Divider,
  Card,
  CardContent,
  Avatar,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  Fingerprint as FingerprintIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { formatDate } from '@utils/formatters'
import { ROUTES } from '@constants/index'
import type { NewsletterAPI } from '@services/api/newsletter/newsletterService'

// Dummy data for demonstration
const DUMMY_NEWSLETTERS: NewsletterAPI[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    is_active: true,
    created_at: '2024-02-20T14:45:00Z',
  },
  {
    id: '3',
    email: 'mike.johnson@example.com',
    is_active: false,
    created_at: '2024-03-10T09:15:00Z',
  },
  {
    id: '4',
    email: 'sarah.williams@example.com',
    is_active: true,
    created_at: '2024-03-25T16:20:00Z',
  },
  {
    id: '5',
    email: 'david.brown@example.com',
    is_active: true,
    created_at: '2024-04-05T11:00:00Z',
  },
]

/**
 * AdminNewsletterDetailPage Component
 * Displays detailed information about a newsletter subscription
 * Currently uses dummy data only
 */
const AdminNewsletterDetailPage = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(ROUTES.ADMIN_NEWSLETTERS)
  }

  // Handle missing ID
  if (!id) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 3 }}>
          {t('common.back')}
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('admin.newsletterDetailPage.provideValidId')}
        </Alert>
      </Container>
    )
  }

  // Find newsletter in dummy data
  const newsletter = DUMMY_NEWSLETTERS.find(n => n.id === id)

  // Error state - newsletter not found
  if (!newsletter) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 3 }}>
          {t('common.back')}
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('admin.newsletterDetailPage.notFound')}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 3 }}>
        {t('common.back')}
      </Button>

      {/* Newsletter Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
            }}
          >
            <EmailIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {newsletter.email}
            </Typography>
            <Chip
              icon={newsletter.is_active ? <CheckCircleIcon /> : <CancelIcon />}
              label={
                newsletter.is_active
                  ? t('admin.newslettersPage.status.active')
                  : t('admin.newslettersPage.status.inactive')
              }
              color={newsletter.is_active ? 'success' : 'default'}
              size="medium"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Newsletter Details */}
      <Grid container spacing={3}>
        {/* Subscription Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('admin.newsletterDetailPage.subscriptionInfo')}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Email */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t('admin.newsletterDetailPage.email')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3 }}>
                    {newsletter.email}
                  </Typography>
                </Box>

                <Divider />

                {/* Status */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    {newsletter.is_active ? (
                      <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    ) : (
                      <CancelIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    )}
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t('admin.newsletterDetailPage.status')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3 }}>
                    {newsletter.is_active
                      ? t('admin.newslettersPage.status.active')
                      : t('admin.newslettersPage.status.inactive')}
                  </Typography>
                </Box>

                <Divider />

                {/* Created Date */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t('admin.newsletterDetailPage.subscribedOn')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3 }}>
                    {formatDate(newsletter.created_at)}
                  </Typography>
                </Box>

                <Divider />

                {/* Newsletter ID */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <FingerprintIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t('admin.newsletterDetailPage.subscriptionId')}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      pl: 3,
                      fontFamily: 'monospace',
                      color: 'text.secondary',
                      wordBreak: 'break-all',
                    }}
                  >
                    {newsletter.id}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('admin.newsletterDetailPage.additionalInfo')}
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                {t('admin.newsletterDetailPage.dummyDataNotice')}
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('admin.newsletterDetailPage.totalEmailsSent')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    0
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('admin.newsletterDetailPage.lastEmailSent')}
                  </Typography>
                  <Typography variant="body1">
                    {t('admin.newsletterDetailPage.never')}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('admin.newsletterDetailPage.subscriptionSource')}
                  </Typography>
                  <Typography variant="body1">
                    {t('admin.newsletterDetailPage.website')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdminNewsletterDetailPage
