import { useState } from 'react'
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
} from '@mui/material'
import {
  ShoppingCart as ShoppingCartIcon,
  ShoppingBag as ShoppingBagIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import type { Order, OrderStatus } from '@features/orders/types'
import { formatCurrency, formatDate } from '@utils/formatters'
import { ROUTES } from '@constants/index'
import { useTranslation } from '@hooks/useTranslation'

// Dummy data for merchant orders
const DUMMY_ORDERS: Order[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    items: [
      {
        id: 'item-1',
        cart_item: {
          id: 'cart-1',
          product: {
            id: 'prod-1',
            name: 'Wireless Headphones',
            description: 'Premium wireless headphones',
            price: 199.99,
            images: [],
            category: { id: 'cat-1', name: 'Electronics' },
            stock: 50,
            rating: 4.5,
            reviewCount: 120,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
          quantity: 2,
          created_at: '2024-03-15T10:00:00Z',
          updated_at: '2024-03-15T10:00:00Z',
          is_deleted: false,
          created_by: 'user-1',
        },
        created_at: '2024-03-15T10:00:00Z',
      },
    ],
    subtotal: 399.98,
    tax: 32.00,
    shipping: 10.00,
    total: 441.98,
    status: 'delivered',
    shipping_address: null,
    billing_address: null,
    payment_status: 'paid',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-16T14:30:00Z',
    created_by: 'user-1',
    is_deleted: false,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    items: [
      {
        id: 'item-2',
        cart_item: {
          id: 'cart-2',
          product: {
            id: 'prod-2',
            name: 'Smart Watch',
            description: 'Fitness tracking smartwatch',
            price: 299.99,
            images: [],
            category: { id: 'cat-1', name: 'Electronics' },
            stock: 30,
            rating: 4.7,
            reviewCount: 85,
            createdAt: '2024-01-10T10:00:00Z',
            updatedAt: '2024-01-10T10:00:00Z',
          },
          quantity: 1,
          created_at: '2024-03-14T15:30:00Z',
          updated_at: '2024-03-14T15:30:00Z',
          is_deleted: false,
          created_by: 'user-2',
        },
        created_at: '2024-03-14T15:30:00Z',
      },
      {
        id: 'item-3',
        cart_item: {
          id: 'cart-3',
          product: {
            id: 'prod-3',
            name: 'Phone Case',
            description: 'Protective phone case',
            price: 24.99,
            images: [],
            category: { id: 'cat-2', name: 'Accessories' },
            stock: 100,
            rating: 4.2,
            reviewCount: 45,
            createdAt: '2024-01-05T10:00:00Z',
            updatedAt: '2024-01-05T10:00:00Z',
          },
          quantity: 1,
          created_at: '2024-03-14T15:30:00Z',
          updated_at: '2024-03-14T15:30:00Z',
          is_deleted: false,
          created_by: 'user-2',
        },
        created_at: '2024-03-14T15:30:00Z',
      },
    ],
    subtotal: 324.98,
    tax: 26.00,
    shipping: 10.00,
    total: 360.98,
    status: 'shipped',
    shipping_address: null,
    billing_address: null,
    payment_status: 'paid',
    created_at: '2024-03-14T15:30:00Z',
    updated_at: '2024-03-15T09:00:00Z',
    created_by: 'user-2',
    is_deleted: false,
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    items: [
      {
        id: 'item-4',
        cart_item: {
          id: 'cart-4',
          product: {
            id: 'prod-4',
            name: 'Laptop Stand',
            description: 'Ergonomic laptop stand',
            price: 49.99,
            images: [],
            category: { id: 'cat-2', name: 'Accessories' },
            stock: 75,
            rating: 4.6,
            reviewCount: 92,
            createdAt: '2024-01-20T10:00:00Z',
            updatedAt: '2024-01-20T10:00:00Z',
          },
          quantity: 3,
          created_at: '2024-03-13T11:20:00Z',
          updated_at: '2024-03-13T11:20:00Z',
          is_deleted: false,
          created_by: 'user-3',
        },
        created_at: '2024-03-13T11:20:00Z',
      },
    ],
    subtotal: 149.97,
    tax: 12.00,
    shipping: 10.00,
    total: 171.97,
    status: 'processing',
    shipping_address: null,
    billing_address: null,
    payment_status: 'paid',
    created_at: '2024-03-13T11:20:00Z',
    updated_at: '2024-03-13T16:45:00Z',
    created_by: 'user-3',
    is_deleted: false,
  },
]

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
  const [currentPage, setCurrentPage] = useState(1)

  // Using dummy data for now
  const merchantOrders = DUMMY_ORDERS
  const totalPages = 1

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value)
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
                              {t('admin.ordersPage.table.moreItems', { count: validItems.length - 2 })}
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
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Container>
  )
}

export default AdminOrdersPage

