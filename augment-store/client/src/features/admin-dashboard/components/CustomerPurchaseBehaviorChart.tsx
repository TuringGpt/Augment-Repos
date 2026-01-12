import { Paper, Typography, Box, useTheme, CircularProgress, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ShoppingBag as ShoppingBagIcon } from '@mui/icons-material'
import { useState } from 'react'
import { useTranslation } from '@hooks/useTranslation'
import type { CustomerPurchaseBehaviorResponse } from '@features/customer-retention/types'

interface CustomerPurchaseBehaviorChartProps {
  data: CustomerPurchaseBehaviorResponse | null
  isLoading?: boolean
}

/**
 * CustomerPurchaseBehaviorChart Component
 * Displays customer purchase behavior analysis with multiple visualizations
 */
const CustomerPurchaseBehaviorChart = ({ data, isLoading = false }: CustomerPurchaseBehaviorChartProps) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1']

  // Transform category preferences for bar chart
  const categoryChartData = data?.category_preferences.slice(0, 8).map((cat) => ({
    name: cat.category.length > 15 ? `${cat.category.substring(0, 15)}...` : cat.category,
    fullName: cat.category,
    customers: cat.unique_customers,
    orders: cat.total_orders,
    avgOrderValue: cat.avg_order_value,
  })) || []

  // Transform payment method distribution for pie chart
  const paymentChartData = data ? Object.entries(data.payment_method_distribution).map(([method, stats]) => ({
    name: method,
    value: stats.customers,
    percentage: stats.percentage,
  })) : []

  // Custom tooltip for category chart
  const CategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload

      return (
        <Paper
          sx={{
            p: 1.5,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {data.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.customerPurchaseBehavior.tooltip.customers')}: {data.customers.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.customerPurchaseBehavior.tooltip.orders')}: {data.orders.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.customerPurchaseBehavior.tooltip.avgOrderValue')}: ${data.avgOrderValue.toFixed(2)}
          </Typography>
        </Paper>
      )
    }
    return null
  }

  // Custom tooltip for payment chart
  const PaymentTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload

      return (
        <Paper
          sx={{
            p: 1.5,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.customerPurchaseBehavior.tooltip.customers')}: {data.value.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.customerPurchaseBehavior.tooltip.percentage')}: {data.percentage.toFixed(1)}%
          </Typography>
        </Paper>
      )
    }
    return null
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ShoppingBagIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('admin.customerPurchaseBehavior.title')}
        </Typography>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 400,
          }}
        >
          <CircularProgress size={40} />
        </Box>
      ) : data ? (
        <>
          {/* Summary Metrics */}
          <Box sx={{ mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t('admin.customerPurchaseBehavior.analysisPeriod')}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {data.period_days} {t('admin.customerPurchaseBehavior.days')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t('admin.customerPurchaseBehavior.activeCustomers')}
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {data.most_active_customers.length.toLocaleString()}
              </Typography>
            </Box>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label={t('admin.customerPurchaseBehavior.tabs.mostActiveCustomers')} />
              <Tab label={t('admin.customerPurchaseBehavior.tabs.categoryPreferences')} />
              <Tab label={t('admin.customerPurchaseBehavior.tabs.paymentMethods')} />
            </Tabs>
          </Box>

          {/* Tab Content */}
          {activeTab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.customerPurchaseBehavior.table.customer')}</TableCell>
                    <TableCell align="right">{t('admin.customerPurchaseBehavior.table.orders')}</TableCell>
                    <TableCell align="right">{t('admin.customerPurchaseBehavior.table.totalSpent')}</TableCell>
                    <TableCell>{t('admin.customerPurchaseBehavior.table.favoriteCategory')}</TableCell>
                    <TableCell>{t('admin.customerPurchaseBehavior.table.paymentMethod')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.most_active_customers.map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {customer.customer_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.customer_email}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{customer.order_count}</TableCell>
                      <TableCell align="right">${customer.total_spent.toFixed(2)}</TableCell>
                      <TableCell>{customer.favorite_category}</TableCell>
                      <TableCell>{customer.preferred_payment_method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 1 && (
            categoryChartData.length > 0 ? (
              <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="name"
                      stroke={theme.palette.text.secondary}
                      style={{ fontSize: '0.75rem' }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      stroke={theme.palette.text.secondary}
                      style={{ fontSize: '0.875rem' }}
                      label={{ value: t('admin.customerPurchaseBehavior.chart.uniqueCustomers'), angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CategoryTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                    <Bar
                      dataKey="customers"
                      name={t('admin.customerPurchaseBehavior.chart.uniqueCustomers')}
                      radius={[8, 8, 0, 0]}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 400,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('admin.customerPurchaseBehavior.emptyStates.noCategoryData')}
                </Typography>
              </Box>
            )
          )}

          {activeTab === 2 && (
            paymentChartData.length > 0 ? (
              <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ payload }) => `${payload.name}: ${payload.percentage.toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PaymentTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 400,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('admin.customerPurchaseBehavior.emptyStates.noPaymentData')}
                </Typography>
              </Box>
            )
          )}
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 400,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('admin.customerPurchaseBehavior.noData')}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default CustomerPurchaseBehaviorChart


