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
import { useNavigate } from 'react-router-dom'
import type { Order, OrderStatus } from '@features/orders/types'
import { formatCurrency, formatDate } from '@utils/formatters'
import { ROUTES } from '@constants/index'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useOrderStore } from '@store/orderStore'



/**
 * AdminOrdersPage Component
 * Admin page for managing merchant orders with table view and pagination
 *
 * Note: Authentication and admin role checks are handled by the AdminRoute guard.
 * This component will only render for authenticated admin users.
 */
const AdminOrdersPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()

  // Use order store
  const {
    merchantOrders,
    currentMerchantPage,
    totalMerchantPages,
    isFetchingMerchantOrders,
    fetchMerchantOrdersError,
    getMerchantOrders,
    setMerchantPage,
  } = useOrderStore()

  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load merchant orders
  const loadMerchantOrders = async () => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    // Fetch merchant orders using the store with abort signal
    await getMerchantOrders(currentMerchantPage, abortControllerRef.current.signal)
  }

  // Fetch merchant orders on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadMerchantOrders()
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
    loadMerchantOrders()
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setMerchantPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Note: setMerchantPage internally calls getMerchantOrders, which is handled in setMerchantPage implementation
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
  if (isFetchingMerchantOrders && merchantOrders.length === 0) {
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
  if (fetchMerchantOrdersError && merchantOrders.length === 0) {
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
          {fetchMerchantOrdersError}
        </Alert>
      </Container>
    )
  }

  // Empty state
  if (merchantOrders.length === 0) {
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
              disabled={isFetchingMerchantOrders}
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
      {fetchMerchantOrdersError && merchantOrders.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {fetchMerchantOrdersError}
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
              <TableCell sx={{ fontWeight: 700 }} align="center">
                {t('admin.ordersPage.table.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {merchantOrders.map((order) => (
              <TableRow
                key={order.id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
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
                        {item.cart_item.product
                          ? `${item.cart_item.product.name} (x${item.cart_item.quantity})`
                          : `${t('admin.ordersPage.table.deletedProduct')} (x${item.cart_item.quantity})`}
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
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(ROUTES.ORDER_DETAIL.replace(':id', order.id))
                    }}
                  >
                    {t('order.viewOrder')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalMerchantPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalMerchantPages}
            page={currentMerchantPage}
            onChange={handlePageChange}
            color="primary"
            disabled={isFetchingMerchantOrders}
          />
        </Box>
      )}
    </Container>
  )
}

export default AdminOrdersPage

