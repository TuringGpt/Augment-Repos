import { useState, useEffect } from 'react'
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
import type { Order, OrderStatus } from '@features/orders/types'
import { formatCurrency, formatDate } from '@utils/formatters'
import { ORDER_STATUS_LABELS } from '@constants/index'

const OrdersPage = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    // Using dummy data instead of API call
    const loadDummyOrders = () => {
      setIsLoading(true)

      // Simulate API delay
      setTimeout(() => {
        const dummyOrders: Order[] = [
          {
            id: '1',
            orderNumber: 'ORD-2024-001',
            items: [
              {
                id: 'item-1',
                product: {
                  id: 'prod-1',
                  name: 'Wireless Headphones',
                  description: 'Premium wireless headphones',
                  price: 99.99,
                  images: ['https://via.placeholder.com/300'],
                  category: { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
                  stock: 50,
                  rating: 4.5,
                  reviewCount: 120,
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
                quantity: 2,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
                is_deleted: false,
                created_by: 'user-1',
              },
              {
                id: 'item-2',
                product: {
                  id: 'prod-2',
                  name: 'Smart Watch',
                  description: 'Feature-rich smartwatch',
                  price: 199.99,
                  discountPrice: 179.99,
                  images: ['https://via.placeholder.com/300'],
                  category: { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
                  stock: 30,
                  rating: 4.7,
                  reviewCount: 85,
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
                quantity: 1,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
                is_deleted: false,
                created_by: 'user-1',
              },
            ],
            subtotal: 379.97,
            tax: 37.99,
            shipping: 5.99,
            total: 423.95,
            status: 'delivered',
            shippingAddress: {
              id: 'addr-1',
              type: 'shipping',
              firstName: 'John',
              lastName: 'Doe',
              addressLine1: '123 Main St',
              addressLine2: 'Apt 4B',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'United States',
              phone: '+1234567890',
              isDefault: true,
            },
            billingAddress: {
              id: 'addr-2',
              type: 'billing',
              firstName: 'John',
              lastName: 'Doe',
              addressLine1: '123 Main St',
              addressLine2: 'Apt 4B',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'United States',
              phone: '+1234567890',
              isDefault: true,
            },
            paymentMethod: 'Credit Card',
            paymentStatus: 'paid',
            createdAt: '2024-11-10T10:30:00Z',
            updatedAt: '2024-11-12T14:20:00Z',
          },
          {
            id: '2',
            orderNumber: 'ORD-2024-002',
            items: [
              {
                id: 'item-3',
                product: {
                  id: 'prod-3',
                  name: 'Laptop Stand',
                  description: 'Ergonomic laptop stand',
                  price: 49.99,
                  images: ['https://via.placeholder.com/300'],
                  category: { id: 'cat-2', name: 'Accessories', slug: 'accessories' },
                  stock: 100,
                  rating: 4.3,
                  reviewCount: 45,
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
                quantity: 1,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
                is_deleted: false,
                created_by: 'user-1',
              },
            ],
            subtotal: 49.99,
            tax: 5.0,
            shipping: 5.99,
            total: 60.98,
            status: 'shipped',
            shippingAddress: {
              id: 'addr-1',
              type: 'shipping',
              firstName: 'John',
              lastName: 'Doe',
              addressLine1: '123 Main St',
              addressLine2: 'Apt 4B',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'United States',
              phone: '+1234567890',
              isDefault: true,
            },
            billingAddress: {
              id: 'addr-2',
              type: 'billing',
              firstName: 'John',
              lastName: 'Doe',
              addressLine1: '123 Main St',
              addressLine2: 'Apt 4B',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'United States',
              phone: '+1234567890',
              isDefault: true,
            },
            paymentMethod: 'PayPal',
            paymentStatus: 'paid',
            createdAt: '2024-11-13T09:15:00Z',
            updatedAt: '2024-11-13T16:45:00Z',
          },
          {
            id: '3',
            orderNumber: 'ORD-2024-003',
            items: [
              {
                id: 'item-4',
                product: {
                  id: 'prod-4',
                  name: 'Mechanical Keyboard',
                  description: 'RGB mechanical keyboard',
                  price: 129.99,
                  discountPrice: 109.99,
                  images: ['https://via.placeholder.com/300'],
                  category: { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
                  stock: 25,
                  rating: 4.8,
                  reviewCount: 200,
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
                quantity: 1,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
                is_deleted: false,
                created_by: 'user-1',
              },
              {
                id: 'item-5',
                product: {
                  id: 'prod-5',
                  name: 'Gaming Mouse',
                  description: 'High-precision gaming mouse',
                  price: 79.99,
                  images: ['https://via.placeholder.com/300'],
                  category: { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
                  stock: 40,
                  rating: 4.6,
                  reviewCount: 150,
                  createdAt: '2024-01-01',
                  updatedAt: '2024-01-01',
                },
                quantity: 1,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
                is_deleted: false,
                created_by: 'user-1',
              },
            ],
            subtotal: 189.98,
            tax: 19.0,
            shipping: 0,
            total: 208.98,
            status: 'processing',
            shippingAddress: {
              id: 'addr-1',
              type: 'shipping',
              firstName: 'John',
              lastName: 'Doe',
              addressLine1: '123 Main St',
              addressLine2: 'Apt 4B',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'United States',
              phone: '+1234567890',
              isDefault: true,
            },
            billingAddress: {
              id: 'addr-2',
              type: 'billing',
              firstName: 'John',
              lastName: 'Doe',
              addressLine1: '123 Main St',
              addressLine2: 'Apt 4B',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'United States',
              phone: '+1234567890',
              isDefault: true,
            },
            paymentMethod: 'Credit Card',
            paymentStatus: 'paid',
            createdAt: '2024-11-14T08:00:00Z',
            updatedAt: '2024-11-14T08:00:00Z',
          },
        ]

        setOrders(dummyOrders)
        setTotalPages(1)
        setIsLoading(false)
      }, 500)
    }

    loadDummyOrders()
  }, [page])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
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

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
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
                    {order.orderNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(order.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {order.items
                      .filter((item) => item.product !== null)
                      .slice(0, 2)
                      .map((item) => (
                        <Typography key={item.id} variant="body2" color="text.secondary">
                          {item.product!.name} (x{item.quantity})
                        </Typography>
                      ))}
                    {order.items.length > 2 && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        +{order.items.length - 2} more
                      </Typography>
                    )}
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
          <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Container>
  )
}

export default OrdersPage
