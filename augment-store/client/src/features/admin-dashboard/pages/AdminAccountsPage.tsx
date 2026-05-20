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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material'
import {
  AccountCircle as AccountCircleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useToast } from '@hooks/useToast'
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
  const toast = useToast()
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
    clearUpdateError,
    setPage,
    updateAdminUser,
    isUpdating,
    updateError,
  } = useAccountStore()

  // Details drawer state
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AdminUser | null>(null)

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<{
    role: 'admin' | 'merchant' | 'member'
    isActive: boolean
  }>({
    role: 'member',
    isActive: true,
  })
  // State to track pending edit drawer open (used to sequence drawer transitions)
  const [pendingEditAccount, setPendingEditAccount] = useState<AdminUser | null>(null)

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
    // If there's a pending edit, open the edit drawer now that the details drawer has fully closed
    if (pendingEditAccount) {
      const account = pendingEditAccount
      setPendingEditAccount(null)

      // Clear any previous update errors to avoid showing stale error UI
      clearUpdateError()

      setSelectedAccount(account)
      setEditFormData({
        role: account.role,
        isActive: account.isActive,
      })
      setIsEditDrawerOpen(true)
      return
    }

    // Clear selectedAccount after the drawer has fully closed
    // This prevents the content from flashing empty during the close transition
    // Only clear if both drawers are closed (prevents race condition if edit drawer is opening)
    if (!isDetailsDrawerOpen && !isEditDrawerOpen) {
      setSelectedAccount(null)
    }
  }

  // Edit drawer handlers
  const handleEditAccount = (account: AdminUser) => {
    // If details drawer is open, close it first and defer opening edit drawer
    // This prevents both drawers from being mounted simultaneously during transitions
    if (isDetailsDrawerOpen) {
      setPendingEditAccount(account)
      handleCloseDetailsDrawer()
      return
    }

    // If details drawer is already closed, open edit drawer immediately
    // Clear any previous update errors to avoid showing stale error UI
    clearUpdateError()

    setSelectedAccount(account)
    setEditFormData({
      role: account.role,
      isActive: account.isActive,
    })
    setIsEditDrawerOpen(true)
  }

  const handleCloseEditDrawer = () => {
    // Prevent closing while update is in progress
    if (isUpdating) {
      return
    }

    setIsEditDrawerOpen(false)
  }

  const handleEditDrawerExited = () => {
    // Clear selectedAccount and form data after the drawer has fully closed
    // Only clear if both drawers are closed (prevents race condition if details drawer is opening)
    if (!isEditDrawerOpen && !isDetailsDrawerOpen) {
      setSelectedAccount(null)
      setEditFormData({
        role: 'member',
        isActive: true,
      })
      // Clear any update errors after drawer is fully closed
      clearUpdateError()
    }
  }

  // Type-safe form change handlers - separate functions for each field type
  const handleRoleChange = (value: 'admin' | 'merchant' | 'member'): void => {
    setEditFormData((prev) => ({
      ...prev,
      role: value,
    }))
  }

  const handleIsActiveChange = (value: boolean): void => {
    setEditFormData((prev) => ({
      ...prev,
      isActive: value,
    }))
  }

  const handleSaveAccount = async () => {
    if (!selectedAccount) return

    try {
      const result = await updateAdminUser(selectedAccount.id, {
        role: editFormData.role,
        is_active: editFormData.isActive,
      })

      // Guard against superseded requests - updateAdminUser returns undefined when
      // the request was superseded by a newer request (see store's request counter guard)
      // Don't show success toast or close drawer for stale requests to prevent false "updated successfully" signal
      if (!result) {
        return
      }

      // Show success message via toast
      toast.success(t('admin.accountsPage.updateSuccess'))

      // Close drawer - state cleanup handled by handleEditDrawerExited
      // Note: We close the drawer directly here instead of calling handleCloseEditDrawer()
      // because setIsUpdating(false) won't update synchronously, which would cause the
      // isUpdating guard in handleCloseEditDrawer to block the close
      // The selectedAccount and form state will be cleared in handleEditDrawerExited
      // after the drawer close animation completes to prevent UI flashing
      setIsEditDrawerOpen(false)
    } catch (err) {
      console.error('Failed to update account:', err)
      // The error is already shown via the updateError state in the drawer
      // Keep drawer open on error so user can retry or cancel
    }
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

  // Helper function to normalize fullName (trim whitespace)
  // Returns the trimmed fullName if it's not empty after trimming, otherwise returns an empty string
  const getNormalizedFullName = (fullName?: string | null): string => {
    return fullName?.trim() || ''
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
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{t('admin.accountsPage.table.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adminUsers.length > 0 ? (
                  adminUsers.map((account) => {
                    const normalizedFullName = getNormalizedFullName(account.fullName)
                    const displayName = normalizedFullName || account.email
                    const avatarInitial = normalizedFullName ? normalizedFullName[0]?.toUpperCase() : '?'

                    return (
                      <TableRow
                        key={account.id}
                        hover
                        onClick={(e) => {
                          // Only trigger row click if clicking outside the actions cell
                          // This prevents conflicts with the nested IconButton
                          const target = e.target
                          if (target instanceof Element) {
                            // Element node: check if it's outside the actions cell
                            if (!target.closest('[data-table-actions]')) {
                              handleAccountClick(account)
                            }
                          } else {
                            // Non-Element node (e.g., Text node): treat as normal row click
                            handleAccountClick(account)
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                            e.preventDefault()
                            handleAccountClick(account)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={t('admin.accountsPage.aria.viewAccountDetails', {
                          name: displayName,
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
                              alt={displayName}
                              sx={{ width: 40, height: 40 }}
                            >
                              {avatarInitial}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {normalizedFullName || '-'}
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
                      <TableCell align="center" data-table-actions>
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditAccount(account)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation()
                              }
                            }}
                            color="primary"
                            size="small"
                            aria-label={t('common.edit')}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    )
                  })
                ) : (
                  // Only show empty state when there's no error
                  !error && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
            <IconButton
              onClick={handleCloseDetailsDrawer}
              sx={{ color: 'white' }}
              aria-label={t('admin.accountsPage.aria.closeDrawer')}
            >
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
                      alt={getNormalizedFullName(selectedAccount.fullName) || selectedAccount.email}
                      sx={{ width: 120, height: 120 }}
                    >
                      {getNormalizedFullName(selectedAccount.fullName)
                        ? getNormalizedFullName(selectedAccount.fullName)[0]?.toUpperCase()
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
                    {getNormalizedFullName(selectedAccount.fullName) || '-'}
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
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => selectedAccount && handleEditAccount(selectedAccount)}
              disabled={!selectedAccount}
            >
              {t('common.edit')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Edit Account Drawer */}
      <Drawer
        anchor="right"
        open={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        SlideProps={{
          onExited: handleEditDrawerExited,
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
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.accountsPage.editAccount')}
            </Typography>
            <IconButton
              onClick={handleCloseEditDrawer}
              disabled={isUpdating}
              sx={{ color: 'white' }}
              aria-label={t('admin.accountsPage.aria.closeEditDrawer')}
            >
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
                      alt={getNormalizedFullName(selectedAccount.fullName) || selectedAccount.email}
                      sx={{ width: 120, height: 120 }}
                    >
                      {getNormalizedFullName(selectedAccount.fullName)
                        ? getNormalizedFullName(selectedAccount.fullName)[0]?.toUpperCase()
                        : '?'}
                    </Avatar>
                  </Box>
                </Grid>

                {/* Full Name (Read-only) */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.table.user')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {getNormalizedFullName(selectedAccount.fullName) || '-'}
                  </Typography>
                </Grid>

                {/* Email (Read-only) */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.table.email')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedAccount.email}
                  </Typography>
                </Grid>

                {/* Role Selector */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="role-select-label">{t('admin.accountsPage.table.role')}</InputLabel>
                    <Select
                      labelId="role-select-label"
                      value={editFormData.role}
                      label={t('admin.accountsPage.table.role')}
                      onChange={(e) =>
                        handleRoleChange(e.target.value as 'admin' | 'merchant' | 'member')
                      }
                      disabled={isUpdating}
                    >
                      <MenuItem value="member">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={t('admin.accountsPage.roles.member')}
                            color="success"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </MenuItem>
                      <MenuItem value="merchant">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={t('admin.accountsPage.roles.merchant')}
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </MenuItem>
                      <MenuItem value="admin">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={t('admin.accountsPage.roles.admin')}
                            color="error"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Status Toggle */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editFormData.isActive}
                        onChange={(e) => handleIsActiveChange(e.target.checked)}
                        disabled={isUpdating}
                        color="success"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>
                          {editFormData.isActive
                            ? t('admin.accountsPage.status.active')
                            : t('admin.accountsPage.status.inactive')}
                        </Typography>
                        {editFormData.isActive ? (
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
                      </Box>
                    }
                  />
                </Grid>

                {/* Update Error Alert */}
                {updateError && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      {updateError}
                    </Alert>
                  </Grid>
                )}

                {/* Date Joined (Read-only) */}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {t('admin.accountsPage.table.joined')}
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedAccount.dateJoined)}
                  </Typography>
                </Grid>

                {/* Account ID (Read-only) */}
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
              onClick={handleCloseEditDrawer}
              disabled={isUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAccount}
              disabled={isUpdating}
            >
              {isUpdating ? t('common.saving') : t('common.save')}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  )
}

export default AdminAccountsPage
