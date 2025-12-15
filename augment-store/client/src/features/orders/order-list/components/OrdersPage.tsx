import { useEffect } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
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
} from '@mui/material'
import {
  ShoppingBag as ShoppingBagIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import type { OrderStatus } from '@features/orders/types'
import { formatCurrency, formatDate } from '@utils/formatters'
import { ORDER_STATUS_LABELS } from '@constants/index'
import { useOrderStore } from '@store/orderStore'

const OrdersPage = () => {
  const navigate = useNavigate()

  // Use order store
  const {
    orders,
    currentPage,
    totalPages,
    isFetchingOrders,
    fetchOrdersError,
    getAllOrders,
  } = useOrderStore()

  useEffect(() => {
    getAllOrders(currentPage, 10)
  }, [currentPage, getAllOrders])

  const handlePageChange = async (_event: React.ChangeEvent<unknown>, value: number) => {
    await getAllOrders(value, 10)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        return <CheckCircleIcon fontSize="small" />
      case 'cancelled':
        return <CancelIcon fontSize="small" />
      default:
        return <ShoppingBagIcon fontSize="small" />
    }
  }

  if (isFetchingOrders) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (fetchOrdersError) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            {fetchOrdersError}
          </Typography>
          <Button variant="contained" onClick={() => getAllOrders(currentPage, 10)} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Paper>
      </Container>
    )
  }

  if (orders.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          My Orders
        </Typography>
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
            No Orders Yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            You haven't placed any orders yet. Start shopping to see your orders here!
          </Typography>
          <Button variant="contained" onClick={() => navigate('/products')}>
            Start Shopping
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          My Orders
        </Typography>
        <Typography color="text.secondary">View and track all your orders in one place</Typography>
      </Box>

      {/* Orders Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Order Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Total
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                    cursor: 'pointer',
                  },
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
                onClick={() => navigate(`/orders/${order.id}`)}
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
                    {(() => {
                      const validItems = order.items.filter((item) => item.cart_item.product != null)
                      return (
                        <>
                          {validItems.slice(0, 2).map((item) => (
                            <Typography key={item.id} variant="body2" color="text.secondary">
                              {item.cart_item.product!.name} (x{item.cart_item.quantity})
                            </Typography>
                          ))}
                          {validItems.length > 2 && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              +{validItems.length - 2} more
                            </Typography>
                          )}
                        </>
                      )
                    })()}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={ORDER_STATUS_LABELS[order.status]}
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
                      navigate(`/orders/${order.id}`)
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Container>
  )
}

export default OrdersPage
