import { useEffect, useRef } from 'react'
import {
  Box,
  Chip,
  Container,
  Paper,
  Typography,
  Button,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  ShoppingBag as ShoppingBagIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import type { Order, OrderStatus } from '@features/orders/types'
import { formatCurrency, formatDate } from '@utils/formatters'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useOrderStore } from '@store/orderStore'
import { useUIStore } from '@store/uiStore'
import { isAbortError } from '@utils/errorUtils'



/**
 * AdminOrdersPage Component
 * Admin page for managing all orders with table view and pagination
 *
 * Note: Authentication and admin role checks are handled by the AdminRoute guard.
 * This component will only render for authenticated admin users.
 */
const AdminOrdersPage = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()
  const { setOrderDetailsDrawerOpen } = useUIStore()

  // Use order store
  const {
    adminOrders,
    currentAdminPage,
    totalAdminPages,
    isFetchingAdminOrders,
    fetchAdminOrdersError,
    getAdminOrders,
    setAdminPage,
    setSelectedOrder,
  } = useOrderStore()

  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load admin orders
  const loadAdminOrders = async () => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      // Fetch admin orders using the store with abort signal
      await getAdminOrders(currentAdminPage, abortControllerRef.current.signal)
    } catch (error) {
      // Ignore abort errors - these are expected when requests are intentionally cancelled
      // (e.g., on refresh or component unmount)
      if (isAbortError(error)) {
        return
      }
      // Error is already handled in getAdminOrders and stored in fetchAdminOrdersError
      // This catch prevents unhandled promise rejections
      console.error('Error loading admin orders:', error)
    }
  }

  // Fetch admin orders on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadAdminOrders()
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
    loadAdminOrders()
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setAdminPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Note: setAdminPage internally calls getAdminOrders, which is handled in setAdminPage implementation
  }

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setOrderDetailsDrawerOpen(true)
  }

  const handleOrderKeyDown = (event: React.KeyboardEvent, order: Order) => {
    // Handle Enter and Space keys for accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOrderClick(order)
    }
  }

  const getStatusColor = (
    status: OrderStatus
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'confirmed':
        return 'info'
      case 'processing':
        return 'primary'
      case 'shipped':
        return 'secondary'
      case 'delivered':
        return 'success'
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <HourglassEmptyIcon fontSize="small" />
      case 'confirmed':
      case 'processing':
        return <ShoppingBagIcon fontSize="small" />
      case 'shipped':
        return <LocalShippingIcon fontSize="small" />
      case 'delivered':
      case 'completed':
        return <CheckCircleIcon fontSize="small" />
      case 'cancelled':
        return <CancelIcon fontSize="small" />
      default:
        return <ShoppingBagIcon fontSize="small" />
    }
  }

  // Loading state
  if (isFetchingAdminOrders && adminOrders.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <ShoppingCartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('admin.ordersPage.title')}
            </Typography>
          </Box>
          <Typography color="text.secondary">
            {t('admin.ordersPage.subtitle')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  // Error state
  if (fetchAdminOrdersError && adminOrders.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <ShoppingCartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('admin.ordersPage.title')}
            </Typography>
          </Box>
          <Typography color="text.secondary">
            {t('admin.ordersPage.subtitle')}
          </Typography>
        </Box>

        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              {t('common.retry')}
            </Button>
          }
        >
          {fetchAdminOrdersError}
        </Alert>
      </Container>
    )
  }

  // Empty state
  if (adminOrders.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <ShoppingCartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('admin.ordersPage.title')}
            </Typography>
          </Box>
          <Typography color="text.secondary">
            {t('admin.ordersPage.subtitle')}
          </Typography>
        </Box>

        <Paper sx={{ p: 6, textAlign: 'center', mt: 3 }}>
          <Box
            sx={{
              fontSize: 80,
              mb: 2,
              opacity: 0.5,
            }}
          >
            📦
          </Box>
          <Typography variant="h6" gutterBottom>
            {t('admin.ordersPage.emptyState.noOrders')}
          </Typography>
          <Typography color="text.secondary">
            {t('admin.ordersPage.emptyState.noOrdersDescription')}
          </Typography>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShoppingCartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('admin.ordersPage.title')}
            </Typography>
          </Box>
          <Tooltip title={t('common.refresh')}>
            <IconButton
              onClick={handleRefresh}
              disabled={isFetchingAdminOrders}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography color="text.secondary">
          {t('admin.ordersPage.subtitle')}
        </Typography>
      </Box>

      {/* Error Alert */}
      {fetchAdminOrdersError && adminOrders.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {fetchAdminOrdersError}
        </Alert>
      )}

      {/* Orders Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>{t('admin.ordersPage.table.orderNumber')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('admin.ordersPage.table.date')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('admin.ordersPage.table.items')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('admin.ordersPage.table.status')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                {t('admin.ordersPage.table.total')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adminOrders.map((order) => (
              <TableRow
                key={order.id}
                onClick={() => handleOrderClick(order)}
                onKeyDown={(e) => handleOrderKeyDown(e, order)}
                tabIndex={0}
                role="button"
                aria-label={t('admin.ordersPage.table.viewOrderDetails', {
                  orderNumber: order.id.slice(0, 8).toUpperCase(),
                })}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&:focus': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '-2px',
                  },
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ORD-{order.id.slice(0, 8).toUpperCase()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(order.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {order.items.slice(0, 2).map((item) => (
                      <Typography key={item.id} variant="body2" color="text.secondary">
                        {item.cart_item && item.cart_item.product
                          ? `${item.cart_item.product.name} (x${item.cart_item.quantity})`
                          : `${t('admin.ordersPage.table.deletedProduct')} (x${item.cart_item?.quantity ?? 0})`}
                      </Typography>
                    ))}
                    {order.items.length > 2 && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {t('admin.ordersPage.table.moreItems', { count: order.items.length - 2 })}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={t(`order.status.${order.status}`)}
                    color={getStatusColor(order.status)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatCurrency(order.total)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalAdminPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, mt: 4, flexWrap: 'wrap' }}>
          <Pagination
            count={totalAdminPages}
            page={currentAdminPage}
            onChange={handlePageChange}
            color="primary"
            disabled={isFetchingAdminOrders}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="page-select-label">{t('admin.ordersPage.pagination.goToPage')}</InputLabel>
            <Select
              labelId="page-select-label"
              id="page-select"
              value={currentAdminPage}
              label={t('admin.ordersPage.pagination.goToPage')}
              onChange={(e) => {
                const newPage = Number(e.target.value)
                setAdminPage(newPage)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              disabled={isFetchingAdminOrders}
            >
              {Array.from({ length: totalAdminPages }, (_, i) => i + 1).map((pageNum) => (
                <MenuItem key={pageNum} value={pageNum}>
                  {t('admin.ordersPage.pagination.pageNumber', { pageNum })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
    </Container>
  )
}

export default AdminOrdersPage

