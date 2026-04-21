import { useState } from 'react'
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
  Construction as ConstructionIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { formatDate } from '@utils/formatters'
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
 * AdminNewslettersPage Component
 * Admin page for managing newsletter subscriptions
 * Currently displays dummy data with table functionality
 */
const AdminNewslettersPage = () => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [newsletters, setNewsletters] = useState<NewsletterAPI[]>(DUMMY_NEWSLETTERS)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(newsletters.length / itemsPerPage)

  const handleRefresh = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setNewsletters(DUMMY_NEWSLETTERS)
      setIsLoading(false)
    }, 1000)
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const handleToggleStatus = (id: string) => {
    setNewsletters(prev =>
      prev.map(newsletter =>
        newsletter.id === id
          ? { ...newsletter, is_active: !newsletter.is_active }
          : newsletter
      )
    )
  }

  // Get paginated newsletters
  const paginatedNewsletters = newsletters.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
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
                {paginatedNewsletters.map((newsletter) => (
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
                          <IconButton size="small" color="primary">
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
