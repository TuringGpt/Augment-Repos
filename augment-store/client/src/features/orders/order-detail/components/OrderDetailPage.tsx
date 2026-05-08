import { useEffect } from 'react'
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
import { useOrderStore } from '@store/orderStore'
import type { Order } from '@features/orders/types'
import { format } from 'date-fns'
import { useTranslation } from '@hooks/useTranslation'
import { PLACEHOLDER_IMAGE } from '@features/products/types/api'

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { selectedOrder, isFetchingOrder, fetchOrderError, getOrderById, clearSelectedOrder } = useOrderStore()

  useEffect(() => {
    const fetchOrder = async () => {
      // Handle missing ID
      if (!id) {
        clearSelectedOrder()
        return
      }

      // Validate ID format (basic validation)
      if (id.trim() === '') {
        clearSelectedOrder()
        return
      }

      try {
        await getOrderById(id)
      } catch (err) {
        // Error is already handled by the store
        console.error('Failed to fetch order:', err)
      }
    }

    fetchOrder()
  }, [id, getOrderById, clearSelectedOrder])

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
      case 'pending':
        return 'default'
      case null:
        return 'default'
      default:
        return 'default'
    }
  }

  const getPaymentStatusLabel = (status: Order['payment_status']) => {
    switch (status) {
      case 'pending':
        return t('order.paymentStatus.pending')
      case 'paid':
        return t('order.paymentStatus.paid')
      case 'failed':
        return t('order.paymentStatus.failed')
      case 'refunded':
        return t('order.paymentStatus.refunded')
      case null:
        return 'Unknown'
      default:
        return 'Unknown'
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

  if (isFetchingOrder) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (fetchOrderError || !selectedOrder) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mb: 3 }}>
            {t('order.backToOrders')}
          </Button>
          <Alert severity="error" sx={{ mb: 2 }}>
            {fetchOrderError || t('order.orderNotFound')}
          </Alert>
          {!id && (
            <Alert severity="info">
              {t('order.provideValidOrderId')}
            </Alert>
          )}
        </Box>
      </Container>
    )
  }

  const order = selectedOrder

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mb: 3 }}>
        {t('order.backToOrders')}
      </Button>

      {/* Order Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocalMallIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {t('order.order')} #{order.id.slice(0, 8).toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('order.placedOn')} {format(new Date(order.created_at), 'PPP')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Chip
                icon={getStatusIcon(order.status)}
                label={t(`order.status.${order.status}`)}
                color={getStatusColor(order.status)}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<PaymentIcon />}
                label={getPaymentStatusLabel(order.payment_status)}
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
              <ReceiptIcon /> {t('order.orderItems')}
            </Typography>
            <Divider sx={{ my: 2 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('order.product')}</TableCell>
                    <TableCell align="center">{t('order.quantity')}</TableCell>
                    <TableCell align="right">{t('order.price')}</TableCell>
                    <TableCell align="right">{t('order.subtotal')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((orderItem) => {
                    const cartItem = orderItem.cart_item

                    // Handle deleted products - show placeholder info instead of hiding
                    // This ensures displayed items match order totals
                    if (!cartItem || !cartItem.product) {
                      // Calculate subtotal from order totals if we can't get product price
                      // For now, show as unavailable since we don't have individual item pricing
                      return (
                        <TableRow key={orderItem.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={PLACEHOLDER_IMAGE}
                                alt={t('order.deletedProduct')}
                                variant="rounded"
                                sx={{ width: 60, height: 60, opacity: 0.5 }}
                              />
                              <Box>
                                <Typography variant="body1" fontWeight={600} color="text.secondary">
                                  {t('order.deletedProduct')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {t('order.productNoLongerAvailable')}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {cartItem?.quantity ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                              -
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    }

                    const product = cartItem.product
                    const subtotal = product.price * cartItem.quantity

                    return (
                      <TableRow key={orderItem.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={product.images?.[0] || PLACEHOLDER_IMAGE}
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
              <ShippingIcon /> {t('order.shippingAddress')}
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
                {t('order.noShippingAddress')}
              </Typography>
            )}
          </Paper>

          {/* Billing Address */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentIcon /> {t('order.billingAddress')}
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
                {t('order.noBillingAddress')}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('order.orderSummary')}
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('order.subtotal')}
                  </Typography>
                  <Typography variant="body2">${order.subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('order.tax')}
                  </Typography>
                  <Typography variant="body2">${order.tax.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('order.shipping')}
                  </Typography>
                  <Typography variant="body2">
                    {order.shipping === 0 ? t('order.free') : `$${order.shipping.toFixed(2)}`}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {t('order.total')}
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main' }}>
                  ${order.total.toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Payment Method */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('order.paymentMethod')}
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
                  {t('order.orderDate')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {format(new Date(order.created_at), 'PPpp')}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('order.lastUpdated')}
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
