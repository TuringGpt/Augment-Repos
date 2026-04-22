import { useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Pagination,
} from '@mui/material'
import {
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { formatDate } from '@utils/formatters'
import { useNewsletterStore } from '@store/newsletterStore'

/**
 * AdminNewslettersPage Component
 * Admin page for managing newsletter subscriptions
 * Fetches and displays newsletter data from the backend
 */
const AdminNewslettersPage = () => {
  const { t } = useTranslation()

  // Get newsletter store state and actions
  const {
    newsletters,
    total,
    page,
    totalPages,
    isLoading,
    error,
    fetchAdminNewsletters,
    setPage,
    clearNewsletters,
  } = useNewsletterStore()

  // Fetch newsletters on mount
  useEffect(() => {
    fetchAdminNewsletters()

    // Cleanup: clear newsletters when component unmounts
    return () => {
      clearNewsletters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = () => {
    fetchAdminNewsletters(page)
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const handleToggleStatus = (id: string) => {
    // TODO: Implement actual API call to toggle newsletter status
    console.log('Toggle status for newsletter:', id)
  }

  // Map error to user-friendly translated message
  const getErrorMessage = (error: string | null): string => {
    if (!error) return ''

    // If error is our error key, translate it
    if (error === 'NEWSLETTER_FETCH_ERROR') {
      return t('newsletter.errors.fetchFailed')
    }

    // If error contains backend validation messages, display them
    // (parseApiError already extracts user-friendly messages from backend)
    return error
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t('common.error')}
          </Typography>
          <Typography variant="body2">
            {getErrorMessage(error)}
          </Typography>
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <EmailIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('admin.newslettersPage.title')}
            </Typography>
          </Box>
          <Typography color="text.secondary">
            {t('admin.newslettersPage.subtitle')}
            {total > 0 && ` (${total} ${t('admin.newslettersPage.totalSubscribers')})`}
          </Typography>
        </Box>
        <Tooltip title={t('admin.newslettersPage.refresh')}>
          <span>
            <IconButton
              onClick={handleRefresh}
              color="primary"
              disabled={isLoading}
              aria-label={t('admin.newslettersPage.refresh')}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Loading State */}
      {isLoading ? (
        <Box
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}
          role="status"
          aria-live="polite"
        >
          <CircularProgress />
          <Typography color="text.secondary">
            {t('admin.newslettersPage.loading')}
          </Typography>
        </Box>
      ) : newsletters.length > 0 ? (
        <Box>
          {/* Newsletters Table */}
          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {t('admin.newslettersPage.table.email')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    {t('admin.newslettersPage.table.status')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    {t('admin.newslettersPage.table.createdAt')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    {t('admin.newslettersPage.table.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newsletters.map((newsletter) => (
                  <TableRow
                    key={newsletter.id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    {/* Email */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {newsletter.email}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell align="center">
                      <Chip
                        label={
                          newsletter.is_active
                            ? t('admin.newslettersPage.status.active')
                            : t('admin.newslettersPage.status.inactive')
                        }
                        size="small"
                        color={newsletter.is_active ? 'success' : 'default'}
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          minWidth: 80,
                        }}
                      />
                    </TableCell>

                    {/* Created At */}
                    <TableCell align="center">
                      <Chip
                        label={formatDate(newsletter.created_at)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title={t('admin.newslettersPage.actions.view')}>
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label={t('admin.newslettersPage.actions.view')}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            newsletter.is_active
                              ? t('admin.newslettersPage.actions.deactivate')
                              : t('admin.newslettersPage.actions.activate')
                          }
                        >
                          <IconButton
                            size="small"
                            color={newsletter.is_active ? 'warning' : 'success'}
                            onClick={() => handleToggleStatus(newsletter.id)}
                            aria-label={
                              newsletter.is_active
                                ? t('admin.newslettersPage.actions.deactivate')
                                : t('admin.newslettersPage.actions.activate')
                            }
                          >
                            {newsletter.is_active ? (
                              <ToggleOffIcon fontSize="small" />
                            ) : (
                              <ToggleOnIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('admin.newslettersPage.noNewsletters')}
          </Typography>
        </Paper>
      )}
    </Container>
  )
}

export default AdminNewslettersPage
