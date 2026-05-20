import { Paper, Typography, Box, useTheme, CircularProgress } from '@mui/material'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { PersonAdd as PersonAddIcon } from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import type { NewVsReturningResponse } from '@features/customer-retention/types'

interface NewVsReturningChartProps {
  data: NewVsReturningResponse | null
  isLoading?: boolean
}

/**
 * NewVsReturningChart Component
 * Displays a pie chart showing new vs returning customers distribution
 */
const NewVsReturningChart = ({ data, isLoading = false }: NewVsReturningChartProps) => {
  const theme = useTheme()
  const { t } = useTranslation()

  // Transform data for pie chart
  const chartData = data ? [
    {
      name: t('admin.newVsReturning.newCustomers'),
      value: data.new_customers.count,
      orders: data.new_customers.orders,
      revenue: data.new_customers.revenue,
      avgOrderValue: data.new_customers.avg_order_value,
      color: theme.palette.info.main,
    },
    {
      name: t('admin.newVsReturning.returningCustomers'),
      value: data.returning_customers.count,
      orders: data.returning_customers.orders,
      revenue: data.returning_customers.revenue,
      avgOrderValue: data.returning_customers.avg_order_value,
      color: theme.palette.primary.main,
    },
  ] : []

  const totalCustomers = data ? data.new_customers.count + data.returning_customers.count : 0

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = totalCustomers > 0 ? ((data.value / totalCustomers) * 100).toFixed(1) : '0.0'

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
            {t('admin.newVsReturning.customers')}: {data.value.toLocaleString()} ({percentage}%)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.newVsReturning.orders')}: {data.orders.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.newVsReturning.revenue')}: ${data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.newVsReturning.avgOrderValue')}: ${data.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Paper>
      )
    }
    return null
  }

  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        opacity: isLoading ? 0.6 : 1,
        transition: 'opacity 0.3s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PersonAddIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">
          {t('admin.newVsReturning.title')}
        </Typography>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
          }}
        >
          <CircularProgress size={40} />
        </Box>
      ) : data && totalCustomers > 0 ? (
        <>
          {/* Summary Metrics */}
          <Box sx={{ mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t('admin.newVsReturning.totalNewCustomers')}
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="info.main">
                {data.new_customers.count.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data.new_customers.orders.toLocaleString()} {t('admin.newVsReturning.orders').toLowerCase()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t('admin.newVsReturning.totalReturningCustomers')}
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {data.returning_customers.count.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data.returning_customers.orders.toLocaleString()} {t('admin.newVsReturning.orders').toLowerCase()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t('admin.newVsReturning.newCustomerRevenue')}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                ${data.new_customers.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data.new_customers.percentage_of_revenue.toFixed(1)}% {t('admin.newVsReturning.ofTotal')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t('admin.newVsReturning.returningCustomerRevenue')}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                ${data.returning_customers.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data.returning_customers.percentage_of_revenue.toFixed(1)}% {t('admin.newVsReturning.ofTotal')}
              </Typography>
            </Box>
          </Box>

          {/* Pie Chart */}
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('admin.newVsReturning.noData')}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default NewVsReturningChart

