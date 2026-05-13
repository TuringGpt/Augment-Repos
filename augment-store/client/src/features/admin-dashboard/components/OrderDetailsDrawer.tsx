import { useMemo } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from '@mui/material'
import {
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  LocalMall as LocalMallIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Circle,
  ShoppingBag as ShoppingBagIcon,
} from '@mui/icons-material'
import { useUIStore } from '@store/uiStore'
import { useOrderStore } from '@store/orderStore'
import { useTranslation } from '@hooks/useTranslation'
import { formatCurrency, formatDate } from '@utils/formatters'
import { PLACEHOLDER_IMAGE } from '@features/products/types/api'
import type { OrderStatus } from '@features/orders/types'

const OrderDetailsDrawer = () => {
  const { t } = useTranslation()
  const { isOrderDetailsDrawerOpen, setOrderDetailsDrawerOpen } = useUIStore()
  const { selectedOrder } = useOrderStore()

  const handleClose = () => {
    setOrderDetailsDrawerOpen(false)
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
        return <Circle fontSize="small" />
    }
  }

  const getStatusColor = (status: OrderStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'confirmed':
      case 'processing':
        return 'info'
      case 'shipped':
        return 'primary'
      case 'delivered':
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getPaymentStatusLabel = (status: 'pending' | 'paid' | 'failed' | 'refunded' | null) => {
    if (!status) return t('order.paymentStatus.notAvailable')
    return t(`order.paymentStatus.${status}`)
  }

  const getPaymentStatusColor = (status: 'pending' | 'paid' | 'failed' | 'refunded' | null): 'default' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'failed':
        return 'error'
      case 'pending':
        return 'warning'
      case 'refunded':
        return 'default'
      default:
        return 'default'
    }
  }

  // Calculate total number of items
  const itemCount = useMemo(() => {
    if (!selectedOrder) return 0
    return selectedOrder.items.reduce((total, item) => {
      return total + (item.cart_item?.quantity || 0)
    }, 0)
  }, [selectedOrder])

  return (
    <Drawer
      anchor="right"
      open={isOrderDetailsDrawerOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 500, md: 600 },
          boxSizing: 'border-box',
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
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartIcon /> {t('order.orderDetails')}
          </Typography>
          <IconButton onClick={handleClose} aria-label={t('common.close')}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        {selectedOrder ? (
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {/* Order Header */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <LocalMallIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {t('order.order')} #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('order.placedOn')} {formatDate(selectedOrder.created_at)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={getStatusIcon(selectedOrder.status)}
                  label={t(`order.status.${selectedOrder.status}`)}
                  color={getStatusColor(selectedOrder.status)}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  icon={<PaymentIcon />}
                  label={getPaymentStatusLabel(selectedOrder.payment_status)}
                  color={getPaymentStatusColor(selectedOrder.payment_status)}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Order Items */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon fontSize="small" /> {t('order.orderItems')} ({itemCount})
              </Typography>
              <Divider sx={{ my: 2 }} />

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('order.product')}</TableCell>
                      <TableCell align="center">{t('order.quantity')}</TableCell>
                      <TableCell align="right">{t('order.price')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((orderItem) => {
                      const cartItem = orderItem.cart_item
                      const product = cartItem?.product

                      // Handle deleted products/cart items
                      if (!cartItem || !product) {
                        return (
                          <TableRow key={orderItem.id}>
                            <TableCell colSpan={3}>
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                {t('order.deletedProduct')} - {t('order.productNoLongerAvailable')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      }

                      const subtotal = product.price * cartItem.quantity

                      return (
                        <TableRow key={orderItem.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                src={product.images?.[0] || PLACEHOLDER_IMAGE}
                                alt={product.name}
                                variant="rounded"
                                sx={{ width: 50, height: 50 }}
                              />
                              <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                                  {product.name}
                                </Typography>
                                {product.category?.name && (
                                  <Typography variant="caption" color="text.secondary">
                                    {product.category.name}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{cartItem.quantity}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {formatCurrency(subtotal)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Order Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {t('order.orderSummary')}
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('order.subtotal')}
                  </Typography>
                  <Typography variant="body2">{formatCurrency(selectedOrder.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('order.tax')}
                  </Typography>
                  <Typography variant="body2">{formatCurrency(selectedOrder.tax)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('order.shipping')}
                  </Typography>
                  <Typography variant="body2">
                    {selectedOrder.shipping === 0 ? t('order.free') : formatCurrency(selectedOrder.shipping)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {t('order.total')}
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main' }}>
                  {formatCurrency(selectedOrder.total)}
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Typography variant="body1" color="text.secondary">
              {t('order.orderNotFound')}
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default OrderDetailsDrawer
