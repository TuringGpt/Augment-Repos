import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  LocalMall as LocalMallIcon,
} from '@mui/icons-material'
import { orderService } from '@services/api/orders/orderService'
import type { Order } from '@features/orders/types'
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@constants/index'
import { format } from 'date-fns'

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      // Handle missing ID
      if (!id) {
        setError('Order ID is required')
        setLoading(false)
        return
      }

      // Validate ID format (basic validation)
      if (id.trim() === '') {
        setError('Invalid order ID')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await orderService.getOrderById(id)
        setOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'error'
      case 'shipped':
        return 'info'
      case 'processing':
        return 'warning'
      case 'confirmed':
        return 'primary'
      default:
        return 'default'
    }
  }

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'failed':
        return 'error'
      case 'refunded':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return <CheckCircleIcon />
      case 'cancelled':
        return <CancelIcon />
      case 'shipped':
        return <ShippingIcon />
      default:
        return <PendingIcon />
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error || !order) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mb: 3 }}>
            Back to Orders
          </Button>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Order not found'}
          </Alert>
          {!id && (
            <Alert severity="info">
              Please provide a valid order ID in the URL.
            </Alert>
          )}
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mb: 3 }}>
        Back to Orders
      </Button>

      {/* Order Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocalMallIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Placed on {format(new Date(order.created_at), 'PPP')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Chip
                icon={getStatusIcon(order.status)}
                label={ORDER_STATUS_LABELS[order.status]}
                color={getStatusColor(order.status)}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<PaymentIcon />}
                label={PAYMENT_STATUS_LABELS[order.payment_status]}
                color={getPaymentStatusColor(order.payment_status)}
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - Order Items */}
        <Grid item xs={12} md={8}>
          {/* Order Items */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon /> Order Items
            </Typography>
            <Divider sx={{ my: 2 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((orderItem) => {
                    const cartItem = orderItem.cart_item
                    const product = cartItem?.product
                    if (!product) return null

                    const subtotal = product.price * cartItem.quantity

                    return (
                      <TableRow key={orderItem.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={product.images?.[0] || '/placeholder.png'}
                              alt={product.name}
                              variant="rounded"
                              sx={{ width: 60, height: 60 }}
                            />
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                {product.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {product.category?.name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{cartItem.quantity}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">${product.price.toFixed(2)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            ${subtotal.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Shipping Address */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShippingIcon /> Shipping Address
            </Typography>
            <Divider sx={{ my: 2 }} />
            {order.shipping_address ? (
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shipping_address.address_line_1}
                </Typography>
                {order.shipping_address.address_line_2 && (
                  <Typography variant="body2" color="text.secondary">
                    {order.shipping_address.address_line_2}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shipping_address.country}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No shipping address available
              </Typography>
            )}
          </Paper>

          {/* Billing Address */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon /> Billing Address
            </Typography>
            <Divider sx={{ my: 2 }} />
            {order.billing_address ? (
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {order.billing_address.first_name} {order.billing_address.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.billing_address.address_line_1}
                </Typography>
                {order.billing_address.address_line_2 && (
                  <Typography variant="body2" color="text.secondary">
                    {order.billing_address.address_line_2}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {order.billing_address.city}, {order.billing_address.state} {order.billing_address.postal_code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.billing_address.country}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No billing address available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2">${order.subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tax
                  </Typography>
                  <Typography variant="body2">${order.tax.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Shipping
                  </Typography>
                  <Typography variant="body2">
                    {order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main' }}>
                  ${order.total.toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Payment Method */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Payment Method
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {order.payment?.payment_method
                    ? order.payment.payment_method.charAt(0).toUpperCase() + order.payment.payment_method.slice(1)
                    : 'N/A'}
                </Typography>
              </Box>

              {/* Order Dates */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Order Date
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {format(new Date(order.created_at), 'PPpp')}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {format(new Date(order.updated_at), 'PPpp')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default OrderDetailPage
