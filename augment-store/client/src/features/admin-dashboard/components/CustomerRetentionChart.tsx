import { Paper, Typography, Box, useTheme, CircularProgress } from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { People as PeopleIcon } from '@mui/icons-material'
import type { CustomerRetentionResponse } from '@features/customer-retention/types'

interface CustomerRetentionChartProps {
  data: CustomerRetentionResponse | null
  isLoading?: boolean
}

/**
 * CustomerRetentionChart Component
 * Displays a line chart showing customer retention rates by cohort month
 */
const CustomerRetentionChart = ({ data, isLoading = false }: CustomerRetentionChartProps) => {
  const theme = useTheme()

  // Transform cohort data for recharts
  const chartData = data?.cohort_analysis.map((cohort) => ({
    month: cohort.cohort_month,
    retentionRate: cohort.retention_rate,
    customers: cohort.customers,
    repeatCustomers: cohort.repeat_customers,
  })) || []

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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
            {data.month}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Retention Rate: {data.retentionRate.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Customers: {data.customers.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Repeat Customers: {data.repeatCustomers.toLocaleString()}
          </Typography>
        </Paper>
      )
    }
    return null
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Customer Retention by Cohort
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
      ) : chartData.length > 0 ? (
        <>
          {/* Summary Metrics */}
          {data && (
            <Box sx={{ mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Customers
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {data.total_customers.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Repeat Purchase Rate
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {data.repeat_purchase_rate.toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Avg Days Between Purchases
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {data.average_days_between_purchases.toFixed(0)} days
                </Typography>
              </Box>
            </Box>
          )}

          {/* Chart */}
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="month"
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.75rem' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.875rem' }}
                  label={{ value: 'Retention Rate (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                <Line
                  type="monotone"
                  dataKey="retentionRate"
                  name="Retention Rate (%)"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={{ fill: theme.palette.primary.main, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
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
            No customer retention data available
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default CustomerRetentionChart

