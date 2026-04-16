import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans } from 'react-i18next'
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Drawer,
  TextField,
  Grid,
  Divider,
} from '@mui/material'
import {
  AttachMoney as CurrencyIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useToast } from '@hooks/useToast'
import { useAuthStore } from '@store/authStore'
import { useCurrencyStore } from '@store/currencyStore'
import { formatDate } from '@utils/formatters'
import { isSupersededError, isAbortError } from '@utils/errorUtils'
import type { Currency } from '@services/api'

/**
 * AdminCurrencyPage Component
 * Admin page for managing currencies
 */
const AdminCurrencyPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toast = useToast()
  const { user, isAuthenticated } = useAuthStore()

  // Use currency store
  const { currencies, isLoading, error, fetchCurrencies, deleteCurrency, createCurrency, isCreating, updateCurrency, isUpdating } = useCurrencyStore()

  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)
  // Track abort controller for create currency requests
  const createAbortControllerRef = useRef<AbortController | null>(null)

  // Local state for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currencyToDelete, setCurrencyToDelete] = useState<Currency | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Local state for create drawer
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    code: '',
    name: '',
    symbol: '',
  })

  // Local state for edit drawer
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    symbol: '',
  })

  // Load currencies function
  const loadCurrencies = () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    // fetchCurrencies handles all errors internally and doesn't rethrow
    fetchCurrencies(abortControllerRef.current.signal)
  }

  // Fetch currencies on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadCurrencies()
    }

    return () => {
      // Cleanup: abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // Cleanup: abort any pending create requests
      if (createAbortControllerRef.current) {
        createAbortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role])

  const handleRefresh = () => {
    loadCurrencies()
  }

  // Delete handlers
  const handleDeleteClick = (currency: Currency) => {
    setCurrencyToDelete(currency)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCancel = () => {
    // Prevent closing dialog during deletion
    if (isDeleting) return

    setDeleteDialogOpen(false)
    setCurrencyToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!currencyToDelete) return

    setIsDeleting(true)

    try {
      // Call the store action to delete the currency
      await deleteCurrency(currencyToDelete.id)

      // Show success message
      toast.success(t('admin.currencyPage.deleteSuccess', 'Currency deleted successfully'))

      // Close dialog
      setDeleteDialogOpen(false)
      setCurrencyToDelete(null)
    } catch (err) {
      // Handle superseded request errors separately - don't show error toast
      // This occurs when clearCurrencies() is called mid-flight
      if (isSupersededError(err)) {
        // Request was superseded (likely by clearCurrencies during logout/navigation)
        // Treat as no-op for UI state - if there was a newer delete request in-flight,
        // it will handle UI updates when it completes. In practice, this is rare since
        // the delete dialog prevents overlapping deletes, but we handle it for consistency.
        return
      }

      // For actual errors, show error toast and keep dialog open for retry
      console.error('Failed to delete currency:', err)
      toast.error(t('admin.currencyPage.errorDeleteCurrency', 'Failed to delete currency'))
      // Keep dialog open on error so user can retry or cancel
    } finally {
      setIsDeleting(false)
    }
  }

  // Create drawer handlers
  const handleOpenCreateDrawer = () => {
    setCreateFormData({
      code: '',
      name: '',
      symbol: '',
    })
    setIsCreateDrawerOpen(true)
  }

  const handleCloseCreateDrawer = () => {
    // Cancel any pending create request to allow users to dismiss the drawer
    // even if a request is stalled, timed out, or experiencing network issues
    if (createAbortControllerRef.current) {
      createAbortControllerRef.current.abort()
    }

    setIsCreateDrawerOpen(false)
    setCreateFormData({
      code: '',
      name: '',
      symbol: '',
    })
  }

  const handleCreateCurrency = async () => {
    try {
      // Cancel any pending create request
      if (createAbortControllerRef.current) {
        createAbortControllerRef.current.abort()
      }

      // Create new abort controller for this request
      createAbortControllerRef.current = new AbortController()

      // Normalize the payload by trimming all fields to keep validation and persisted data consistent
      // This ensures symbols (and code/name) with leading/trailing whitespace are not persisted
      const normalizedPayload = {
        code: createFormData.code.trim(),
        name: createFormData.name.trim(),
        symbol: createFormData.symbol.trim(),
      }

      // Call the store action to create the currency
      await createCurrency(normalizedPayload, createAbortControllerRef.current.signal)

      // Show success message
      toast.success(t('admin.currencyPage.createSuccess', 'Currency created successfully'))

      // Close drawer
      handleCloseCreateDrawer()
    } catch (err) {
      // Handle abort errors - don't show error toast for cancelled requests
      // This occurs when the component unmounts or user navigates away
      if (isAbortError(err)) {
        return
      }

      // Handle superseded request errors separately - don't show error toast
      // This occurs when overlapping creates or clearCurrencies() happens mid-flight
      if (isSupersededError(err)) {
        // Request was superseded by a newer request - treat as no-op for UI state
        // The newer in-flight request will handle all UI updates when it completes
        // (either showing success message and closing drawer, or showing error and keeping drawer open)
        // Closing the drawer or resetting the form here would interfere with the newer request:
        // - If the newer request succeeds, the user won't see the success message
        // - If the newer request fails, the user won't see the error or be able to retry
        return
      }

      // For actual errors, show error toast and keep drawer open for retry
      // The error message from the store is already user-friendly (parsed by parseApiError)
      console.error('Failed to create currency:', err)
      const errorMessage = err instanceof Error ? err.message : t('admin.currencyPage.errorCreateCurrency', 'Failed to create currency')
      toast.error(errorMessage)
      // Keep drawer open on error so user can retry or cancel
    }
  }

  // Edit drawer handlers
  const handleEditClick = (currency: Currency) => {
    setSelectedCurrency(currency)
    setEditFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
    })
    setIsEditDrawerOpen(true)
  }

  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false)
    setSelectedCurrency(null)
    setEditFormData({
      code: '',
      name: '',
      symbol: '',
    })
  }

  const handleEditCurrency = async () => {
    if (!selectedCurrency) return

    // Capture the currency ID being submitted to guard against race conditions
    // If user opens a different currency's drawer mid-flight, we shouldn't close it
    const submittedCurrencyId = selectedCurrency.id

    try {
      // Normalize the payload by trimming all fields to keep validation and persisted data consistent
      // This ensures symbols (and code/name) with leading/trailing whitespace are not persisted
      const normalizedPayload = {
        code: editFormData.code.trim(),
        name: editFormData.name.trim(),
        symbol: editFormData.symbol.trim(),
      }

      // Call the store action to update the currency
      await updateCurrency(selectedCurrency.id, normalizedPayload)

      // Show success message
      toast.success(t('admin.currencyPage.updateSuccess', 'Currency updated successfully'))

      // Close drawer only if it's still editing the same currency that was submitted
      // This prevents closing a different currency's drawer if user opened it mid-flight
      if (selectedCurrency?.id === submittedCurrencyId) {
        handleCloseEditDrawer()
      }
    } catch (err) {
      // Handle superseded request errors separately - don't show error toast
      // This occurs when overlapping updates or clearCurrencies() happens mid-flight
      if (isSupersededError(err)) {
        // Request was superseded by a newer request - treat as no-op for UI state
        // The newer in-flight request will handle all UI updates when it completes
        // (either showing success message and closing drawer, or showing error and keeping drawer open)
        // Closing the drawer or resetting the form here would interfere with the newer request:
        // - If the newer request succeeds, the user won't see the success message
        // - If the newer request fails, the user won't see the error or be able to retry
        return
      }

      // For actual errors, show error toast and keep drawer open for retry
      // The error message from the store is already user-friendly (parsed by parseApiError)
      console.error('Failed to update currency:', err)
      const errorMessage = err instanceof Error ? err.message : t('admin.currencyPage.errorUpdateCurrency', 'Failed to update currency')
      toast.error(errorMessage)
      // Keep drawer open on error so user can retry or cancel
    }
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            {t('admin.currencyPage.title', 'Currency Management')}
          </Typography>
          <Typography color="text.secondary">
            {t('admin.currencyPage.subtitle', 'View and manage supported currencies')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDrawer}
            disabled={isLoading}
          >
            {t('admin.currencyPage.addCurrency', 'Add Currency')}
          </Button>
          <Tooltip title={t('admin.currencyPage.refresh', 'Refresh')}>
            <span>
              <IconButton onClick={handleRefresh} color="primary" disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && currencies.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : currencies.length > 0 ? (
        /* Currencies Table */
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t('admin.currencyPage.table.code', 'Code')}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t('admin.currencyPage.table.name', 'Name')}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t('admin.currencyPage.table.symbol', 'Symbol')}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t('admin.currencyPage.table.createdAt', 'Created At')}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t('admin.currencyPage.table.updatedAt', 'Updated At')}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  {t('admin.currencyPage.table.actions', 'Actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow
                  key={currency.id}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  {/* Currency Code */}
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {currency.code}
                    </Typography>
                  </TableCell>

                  {/* Currency Name */}
                  <TableCell>
                    <Typography variant="body2">{currency.name}</Typography>
                  </TableCell>

                  {/* Currency Symbol */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {currency.symbol}
                    </Typography>
                  </TableCell>

                  {/* Created At */}
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(currency.created_at)}
                    </Typography>
                  </TableCell>

                  {/* Updated At */}
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(currency.updated_at)}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="center">
                    <Tooltip title={t('common.edit', 'Edit')}>
                      <IconButton
                        onClick={() => handleEditClick(currency)}
                        color="primary"
                        size="small"
                        aria-label={t('common.edit', 'Edit')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete', 'Delete')}>
                      <IconButton
                        onClick={() => handleDeleteClick(currency)}
                        color="error"
                        size="small"
                        aria-label={t('common.delete', 'Delete')}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Empty State */
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CurrencyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            {t('admin.currencyPage.noCurrencies', 'No currencies available')}
          </Typography>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-currency-dialog-title"
        aria-describedby="delete-currency-dialog-description"
      >
        <DialogTitle id="delete-currency-dialog-title">
          {t('admin.currencyPage.deleteCurrency', 'Delete Currency')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-currency-dialog-description">
            <Trans
              i18nKey="admin.currencyPage.deleteCurrencyConfirm"
              values={{
                currencyName: currencyToDelete?.name ?? '',
                currencyCode: currencyToDelete?.code ?? '',
              }}
              components={{ strong: <strong /> }}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary" disabled={isDeleting} autoFocus>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting
              ? t('admin.currencyPage.deleting', 'Deleting...')
              : t('common.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Currency Drawer */}
      <Drawer
        anchor="right"
        open={isCreateDrawerOpen}
        onClose={handleCloseCreateDrawer}
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
              {t('admin.currencyPage.createCurrency', 'Create Currency')}
            </Typography>
            <IconButton
              onClick={handleCloseCreateDrawer}
              sx={{ color: 'white' }}
              aria-label={t('admin.currencyPage.closeDrawer', 'Close create currency drawer')}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <Grid container spacing={3}>
              {/* Currency Code */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.currencyPage.form.code', 'Currency Code')}
                  value={createFormData.code}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, code: e.target.value })
                  }
                  placeholder={t('admin.currencyPage.form.codePlaceholder', 'e.g., USD')}
                  required
                  helperText={t(
                    'admin.currencyPage.form.codeHelper',
                    'Enter the 3-letter currency code'
                  )}
                />
              </Grid>

              {/* Currency Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.currencyPage.form.name', 'Currency Name')}
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, name: e.target.value })
                  }
                  placeholder={t('admin.currencyPage.form.namePlaceholder', 'e.g., US Dollar')}
                  required
                  helperText={t(
                    'admin.currencyPage.form.nameHelper',
                    'Enter the full name of the currency'
                  )}
                />
              </Grid>

              {/* Currency Symbol */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.currencyPage.form.symbol', 'Currency Symbol')}
                  value={createFormData.symbol}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, symbol: e.target.value })
                  }
                  placeholder={t('admin.currencyPage.form.symbolPlaceholder', 'e.g., $')}
                  required
                  helperText={t(
                    'admin.currencyPage.form.symbolHelper',
                    'Enter the currency symbol'
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Footer Actions */}
          <Divider />
          <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleCloseCreateDrawer}>
              {t('admin.currencyPage.form.cancel', 'Cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateCurrency}
              disabled={!createFormData.code.trim() || !createFormData.name.trim() || !createFormData.symbol.trim() || isCreating}
            >
              {isCreating
                ? t('admin.currencyPage.form.creating', 'Creating...')
                : t('admin.currencyPage.form.create', 'Create')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Edit Currency Drawer */}
      <Drawer
        anchor="right"
        open={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
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
              {t('admin.currencyPage.editCurrency', 'Edit Currency')}
            </Typography>
            <IconButton
              onClick={handleCloseEditDrawer}
              sx={{ color: 'white' }}
              aria-label={t('admin.currencyPage.closeEditDrawer', 'Close edit currency drawer')}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <Grid container spacing={3}>
              {/* Currency Code */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.currencyPage.form.code', 'Currency Code')}
                  value={editFormData.code}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, code: e.target.value })
                  }
                  placeholder={t('admin.currencyPage.form.codePlaceholder', 'e.g., USD')}
                  required
                  helperText={t(
                    'admin.currencyPage.form.codeHelper',
                    'Enter the 3-letter currency code'
                  )}
                />
              </Grid>

              {/* Currency Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.currencyPage.form.name', 'Currency Name')}
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  placeholder={t('admin.currencyPage.form.namePlaceholder', 'e.g., US Dollar')}
                  required
                  helperText={t(
                    'admin.currencyPage.form.nameHelper',
                    'Enter the full name of the currency'
                  )}
                />
              </Grid>

              {/* Currency Symbol */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.currencyPage.form.symbol', 'Currency Symbol')}
                  value={editFormData.symbol}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, symbol: e.target.value })
                  }
                  placeholder={t('admin.currencyPage.form.symbolPlaceholder', 'e.g., $')}
                  required
                  helperText={t(
                    'admin.currencyPage.form.symbolHelper',
                    'Enter the currency symbol'
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Footer Actions */}
          <Divider />
          <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleCloseEditDrawer}>
              {t('admin.currencyPage.form.cancel', 'Cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditCurrency}
              disabled={!editFormData.code.trim() || !editFormData.name.trim() || !editFormData.symbol.trim() || isUpdating}
            >
              {isUpdating
                ? t('admin.currencyPage.form.updating', 'Updating...')
                : t('admin.currencyPage.form.update', 'Update')}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  )
}

export default AdminCurrencyPage

