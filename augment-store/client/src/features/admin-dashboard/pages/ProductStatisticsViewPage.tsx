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
  Chip,
  TextField,
  InputAdornment,
  LinearProgress,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useDebounce } from '@hooks/useDebounce'
import { useAuthStore } from '@store/authStore'
import { useProductStatisticsStore } from '@store/productStatisticsStore'
import { formatCurrency } from '@utils/formatters'
import { ROUTES } from '@constants/index'

/**
 * ProductStatisticsViewPage Component
 * Dedicated page for viewing detailed product statistics from the products table
 */
const ProductStatisticsViewPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()
  const {
    statistics,
    isLoading,
    error,
    fetchStatistics,
    clearStatisticsError,
  } = useProductStatisticsStore()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Calculate current page for API (1-based)
  const apiPage = page + 1

  // Reset page to 0 when debounced search query changes
  useEffect(() => {
    setPage(0)
  }, [debouncedSearchQuery])

  // Fetch statistics on mount and when page/rowsPerPage/search changes
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadStatistics()
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPage, rowsPerPage, debouncedSearchQuery, isAuthenticated, user?.role])

  const loadStatistics = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      await fetchStatistics(
        {
          page: apiPage,
          page_size: rowsPerPage,
          search: debouncedSearchQuery || undefined,
        },
        abortController.signal
      )
    } catch (err) {
      console.error('Failed to fetch product statistics:', err)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleRefresh = () => {
    clearStatisticsError()
    loadStatistics()
  }

  const handleViewProduct = (productId: string) => {
    navigate(ROUTES.PRODUCT_DETAIL.replace(':id', productId))
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    // Page reset is handled by useEffect watching debouncedSearchQuery
  }

  // Use server-filtered results directly
  const displayedProducts = statistics?.results || []

  // Calculate metrics
  const calculateConversionRate = (views: number, purchases: number) => {
    if (views === 0) return '0.00'
    return ((purchases / views) * 100).toFixed(2)
  }

  const calculateCartConversionRate = (cartAdds: number, purchases: number) => {
    if (cartAdds === 0) return '0.00'
    return ((purchases / cartAdds) * 100).toFixed(2)
  }

  const calculateAbandonmentRate = (cartAdds: number, cartRemoves: number) => {
    if (cartAdds === 0) return '0.00'
    return ((cartRemoves / cartAdds) * 100).toFixed(2)
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('admin.dashboard.pleaseLogin')}
        </Alert>
        <Button variant="contained" onClick={() => navigate(ROUTES.LOGIN)}>
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
        <Button variant="contained" onClick={() => navigate(ROUTES.HOME)}>
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
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon fontSize="large" />
            {t('admin.productStatistics.productStatisticsView.title')}
          </Typography>
          <Typography color="text.secondary">
            {t('admin.productStatistics.productStatisticsView.subtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('admin.productStatistics.productStatisticsView.refresh')}>
          <IconButton onClick={handleRefresh} color="primary" disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t('admin.productStatistics.productStatisticsView.searchPlaceholder')}
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={clearStatisticsError}
        >
          {error}
        </Alert>
      )}

      {/* Loading Progress */}
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Statistics Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  {t('admin.productStatistics.productStatisticsView.productName')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  {t('admin.productStatistics.productStatisticsView.price')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <VisibilityIcon fontSize="small" />
                    {t('admin.productStatistics.productStatisticsView.views')}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <ShoppingCartIcon fontSize="small" />
                    {t('admin.productStatistics.productStatisticsView.cartAdds')}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  {t('admin.productStatistics.productStatisticsView.cartRemoves')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <TrendingUpIcon fontSize="small" />
                    {t('admin.productStatistics.productStatisticsView.purchases')}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  {t('admin.productStatistics.productStatisticsView.conversionRate')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  {t('admin.productStatistics.productStatisticsView.cartConversion')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  {t('admin.productStatistics.productStatisticsView.abandonmentRate')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>
                  {t('admin.productStatistics.productStatisticsView.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && displayedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : displayedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      {debouncedSearchQuery
                        ? t('admin.productStatistics.productStatisticsView.noResultsFound')
                        : t('admin.productStatistics.productStatisticsView.noData')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedProducts.map((product) => {
                  const conversionRate = calculateConversionRate(product.view_count, product.purchase_count)
                  const cartConversion = calculateCartConversionRate(product.cart_add_count, product.purchase_count)
                  const abandonmentRate = calculateAbandonmentRate(product.cart_add_count, product.cart_remove_count)

                  return (
                    <TableRow
                      key={product.product_id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {product.product_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {formatCurrency(parseFloat(product.product_price))}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={product.view_count.toLocaleString()}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={product.cart_add_count.toLocaleString()}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={product.cart_remove_count.toLocaleString()}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={product.purchase_count.toLocaleString()}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${conversionRate}%`}
                          size="small"
                          color={Number(conversionRate) > 5 ? 'success' : Number(conversionRate) > 2 ? 'warning' : 'error'}
                          sx={{ minWidth: 60 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${cartConversion}%`}
                          size="small"
                          color={Number(cartConversion) > 50 ? 'success' : Number(cartConversion) > 25 ? 'warning' : 'error'}
                          sx={{ minWidth: 60 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${abandonmentRate}%`}
                          size="small"
                          color={Number(abandonmentRate) < 25 ? 'success' : Number(abandonmentRate) < 50 ? 'warning' : 'error'}
                          sx={{ minWidth: 60 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('admin.productStatistics.productStatisticsView.viewProduct')}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewProduct(product.product_id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={statistics?.count || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('admin.productStatistics.productStatisticsView.rowsPerPage')}
        />
      </Paper>
    </Container>
  )
}

export default ProductStatisticsViewPage

