import { useEffect } from 'react'
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
  CircularProgress,
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
import { useNewsletterStore } from '@store/newsletterStore'

/**
 * AdminNewsletterDetailPage Component
 * Displays detailed information about a newsletter subscription
 * Fetches data from the backend using the newsletter store
 */
const AdminNewsletterDetailPage = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  // Get newsletter store state and actions
  const {
    currentNewsletter: newsletter,
    isFetchingById,
    fetchByIdError,
    fetchAdminNewsletterById,
    clearCurrentNewsletter,
  } = useNewsletterStore()

  // Fetch newsletter data when component mounts or id changes
  useEffect(() => {
    if (id) {
      fetchAdminNewsletterById(id)
    }

    // Cleanup on unmount
    return () => {
      clearCurrentNewsletter()
    }
  }, [id, fetchAdminNewsletterById, clearCurrentNewsletter])

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

  // Loading state
  if (isFetchingById && !newsletter) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 3 }}>
          {t('common.back')}
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  // Error state - fetch failed
  if (fetchByIdError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 3 }}>
          {t('common.back')}
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {fetchByIdError}
        </Alert>
        <Button variant="contained" onClick={() => fetchAdminNewsletterById(id)}>
          {t('common.retry')}
        </Button>
      </Container>
    )
  }

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
