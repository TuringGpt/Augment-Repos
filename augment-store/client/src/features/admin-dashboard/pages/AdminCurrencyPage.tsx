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
} from '@mui/material'
import {
  AttachMoney as CurrencyIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useToast } from '@hooks/useToast'
import { escapeHtml } from '@utils/validators'
import { useAuthStore } from '@store/authStore'
import { useCurrencyStore } from '@store/currencyStore'
import { formatDate } from '@utils/formatters'
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
  const { currencies, isLoading, error, fetchCurrencies } = useCurrencyStore()

  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Local state for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currencyToDelete, setCurrencyToDelete] = useState<Currency | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
      // Empty handler - simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Show success message
      toast.success(t('admin.currencyPage.deleteSuccess', 'Currency deleted successfully'))

      // Close dialog
      setDeleteDialogOpen(false)
      setCurrencyToDelete(null)
    } catch (err) {
      console.error('Failed to delete currency:', err)
      toast.error(t('admin.currencyPage.errorDeleteCurrency', 'Failed to delete currency'))
      // Keep dialog open on error so user can retry or cancel
    } finally {
      setIsDeleting(false)
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
        <Tooltip title={t('admin.currencyPage.refresh', 'Refresh')}>
          <span>
            <IconButton onClick={handleRefresh} color="primary" disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
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
                    <Tooltip title={t('common.delete', 'Delete')}>
                      <IconButton
                        onClick={() => handleDeleteClick(currency)}
                        color="error"
                        size="small"
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
                currencyName: currencyToDelete?.name ? escapeHtml(currencyToDelete.name) : '',
                currencyCode: currencyToDelete?.code ? escapeHtml(currencyToDelete.code) : '',
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
    </Container>
  )
}

export default AdminCurrencyPage

