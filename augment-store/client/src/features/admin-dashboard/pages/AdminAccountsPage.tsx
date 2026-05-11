import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Pagination,
} from '@mui/material'
import {
  AccountCircle as AccountCircleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useAccountStore } from '@store/accountStore'

/**
 * AdminAccountsPage Component
 * Admin page for managing user accounts
 *
 * Note: This component uses defense-in-depth for access control:
 * 1. Primary enforcement: AdminRoute guard redirects non-admin users to home
 * 2. Secondary enforcement: Component-level checks render login/access-denied states
 *    (These provide graceful fallback UI in case the component is rendered outside the guard)
 */
const AdminAccountsPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const {
    adminUsers,
    total,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchAdminUsers,
    clearError,
    setPage,
  } = useAccountStore()

  // Fetch admin users on mount using the stored currentPage to avoid page/data mismatch
  // If the user previously paged through the data and revisits this page, they will see
  // the same page they were on before, maintaining a consistent UI state
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAdminUsers(currentPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role])

  const handleRefresh = () => {
    clearError()
    fetchAdminUsers(currentPage)
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Note: setPage internally calls fetchAdminUsers
  }

  // Wait for persisted state to rehydrate before checking auth state
  // This prevents showing misleading "please login" or "access denied" UI
  // during the brief hydration period on initial page load
  if (!hasHydrated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
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

  // Helper function to get role color
  const getRoleColor = (role: string): 'error' | 'warning' | 'success' | 'default' => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'merchant':
        return 'warning'
      case 'member':
        return 'success'
      default:
        return 'default'
    }
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <AccountCircleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('admin.accountsPage.title')}
            </Typography>
          </Box>
          <Typography color="text.secondary">
            {t('admin.accountsPage.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {t('common.refresh')}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && adminUsers.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Accounts Table */}
          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>{t('admin.accountsPage.table.user')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('admin.accountsPage.table.email')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('admin.accountsPage.table.username')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('admin.accountsPage.table.role')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('admin.accountsPage.table.status')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('admin.accountsPage.table.joined')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adminUsers.length > 0 ? (
                  adminUsers.map((account) => (
                    <TableRow
                      key={account.id}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={account.profileImage?.file || undefined}
                            alt={account.fullName}
                            sx={{ width: 40, height: 40 }}
                          >
                            {account.fullName && account.fullName.length > 0
                              ? account.fullName.charAt(0).toUpperCase()
                              : '?'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {account.fullName || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.username || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={account.role.toUpperCase()}
                          color={getRoleColor(account.role)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {account.isActive ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label={t('admin.accountsPage.status.active')}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            icon={<CancelIcon />}
                            label={t('admin.accountsPage.status.inactive')}
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(account.dateJoined)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {t('admin.accountsPage.emptyState.noAccounts')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary and Pagination */}
          {adminUsers.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('admin.accountsPage.summary.totalAccounts')} {total}
              </Typography>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  disabled={isLoading}
                />
              )}
            </Box>
          )}
        </>
      )}
    </Container>
  )
}

export default AdminAccountsPage
