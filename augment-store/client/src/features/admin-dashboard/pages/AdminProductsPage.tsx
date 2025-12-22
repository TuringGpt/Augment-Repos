import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  RemoveShoppingCart as RemoveCartIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useProductStatisticsStore } from '@store/productStatisticsStore'
import { formatCurrency } from '@utils/formatters'

/**
 * AdminProductsPage Component
 * Admin page for viewing product statistics with table view and pagination
 */
const AdminProductsPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()
  const { statistics, isLoading, error, fetchStatistics, clearError } = useProductStatisticsStore()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch statistics on mount and when page/rowsPerPage changes
  useEffect(() => {
    loadStatistics()
    return () => {
      // Cleanup: abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage])

  const loadStatistics = async () => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      await fetchStatistics(
        {
          page: page + 1, // API uses 1-based pagination
          page_size: rowsPerPage,
        },
        abortController.signal
      )
    } catch (err) {
      // Error is handled in the store
      console.error('Failed to fetch product statistics:', err)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0) // Reset to first page
  }

  const handleRefresh = () => {
    loadStatistics()
  }

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`)
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
            {t('admin.productStatistics.title')}
          </Typography>
          <Typography color="text.secondary">
            {t('admin.productStatistics.subtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('admin.productStatistics.refresh')}>
          <IconButton onClick={handleRefresh} color="primary" disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && !statistics ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : statistics && statistics.results.length > 0 ? (
        <Box sx={{ position: 'relative' }}>
          {/* Loading overlay for pagination changes */}
          {isLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* Statistics Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.productStatistics.table.productName')}</TableCell>
                  <TableCell align="right">{t('admin.productStatistics.table.price')}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <TrendingUpIcon fontSize="small" />
                      {t('admin.productStatistics.table.views')}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <ShoppingCartIcon fontSize="small" />
                      {t('admin.productStatistics.table.cartAdds')}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <RemoveCartIcon fontSize="small" />
                      {t('admin.productStatistics.table.cartRemoves')}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{t('admin.productStatistics.table.purchases')}</TableCell>
                  <TableCell align="center">{t('admin.productStatistics.table.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statistics.results.map((item) => (
                  <TableRow key={item.product_id} hover>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell align="right">{formatCurrency(parseFloat(item.product_price))}</TableCell>
                    <TableCell align="right">{item.view_count.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.cart_add_count.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.cart_remove_count.toLocaleString()}</TableCell>
                    <TableCell align="right">{item.purchase_count.toLocaleString()}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('admin.productStatistics.table.viewProduct')}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewProduct(item.product_id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={statistics.count}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage={t('admin.productStatistics.table.rowsPerPage')}
          />
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('admin.productStatistics.noData')}
          </Typography>
        </Paper>
      )}
    </Container>
  )
}

export default AdminProductsPage
