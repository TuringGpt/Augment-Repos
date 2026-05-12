import { useEffect, useState } from 'react'
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
  Drawer,
  IconButton,
  Divider,
  Grid,
} from '@mui/material'
import {
  AccountCircle as AccountCircleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useAccountStore } from '@store/accountStore'
import type { AdminUser } from '@features/accounts/types'

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
  const { t, i18n } = useTranslation()
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

  // Details drawer state
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AdminUser | null>(null)

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

  // Details drawer handlers
  const handleAccountClick = (account: AdminUser) => {
    setSelectedAccount(account)
    setIsDetailsDrawerOpen(true)
  }

  const handleCloseDetailsDrawer = () => {
    setIsDetailsDrawerOpen(false)
  }

  const handleDrawerExited = () => {
    // Clear selectedAccount after the drawer has fully closed
    // This prevents the content from flashing empty during the close transition
    setSelectedAccount(null)
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
  // Uses the app's selected i18n language to ensure date formatting matches the UI locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Check if the date is valid before formatting
    if (isNaN(date.getTime())) {
      return dateString
    }
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
                      hover
                      onClick={() => handleAccountClick(account)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleAccountClick(account)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={t('admin.accountsPage.aria.viewAccountDetails', {
                        name: account.fullName || account.email,
                      })}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s',
                        '&:focus': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: '-2px',
                        },
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
                  // Only show empty state when there's no error
                  !error && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {t('admin.accountsPage.emptyState.noAccounts')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
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

      {/* Account Details Drawer */}
      <Drawer
        anchor="right"
        open={isDetailsDrawerOpen}
        onClose={handleCloseDetailsDrawer}
        SlideProps={{
          onExited: handleDrawerExited,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 500, md: 600 },
            maxWidth: '100%',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'info.main',
              color: 'white',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.accountsPage.accountDetails')}
            </Typography>
            <IconButton onClick={handleCloseDetailsDrawer} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {selectedAccount && (
              <Grid container spacing={3}>
                {/* Profile Image */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Avatar
                      src={selectedAccount.profileImage?.file || undefined}
                      alt={selectedAccount.fullName}
                      sx={{ width: 120, height: 120 }}
                    >
                      {selectedAccount.fullName && selectedAccount.fullName.length > 0
                        ? selectedAccount.fullName.charAt(0).toUpperCase()
                        : '?'}
                    </Avatar>
                  </Box>
                </Grid>

                {/* Full Name */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.table.user')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedAccount.fullName || '-'}
                  </Typography>
                </Grid>

                {/* Email */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.table.email')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedAccount.email}
                  </Typography>
                </Grid>

                {/* Username */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.table.username')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedAccount.username || '-'}
                  </Typography>
                </Grid>

                {/* Role */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.table.role')}
                  </Typography>
                  <Box>
                    <Chip
                      label={selectedAccount.role.toUpperCase()}
                      color={getRoleColor(selectedAccount.role)}
                      size="medium"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>

                {/* Status */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.table.status')}
                  </Typography>
                  <Box>
                    {selectedAccount.isActive ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={t('admin.accountsPage.status.active')}
                        color="success"
                        size="medium"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<CancelIcon />}
                        label={t('admin.accountsPage.status.inactive')}
                        color="default"
                        size="medium"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Grid>

                {/* Preferred Currency */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.preferredCurrency')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedAccount.preferredCurrency
                      ? `${selectedAccount.preferredCurrency.name} (${selectedAccount.preferredCurrency.symbol})`
                      : '-'}
                  </Typography>
                </Grid>

                {/* Date Joined */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.table.joined')}
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedAccount.dateJoined)}
                  </Typography>
                </Grid>

                {/* Account ID */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.accountId')}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      bgcolor: 'grey.100',
                      p: 1,
                      borderRadius: 1,
                      wordBreak: 'break-all',
                    }}
                  >
                    {selectedAccount.id}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Box>

          {/* Footer Actions */}
          <Divider />
          <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCloseDetailsDrawer}
            >
              {t('common.close')}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  )
}

export default AdminAccountsPage
