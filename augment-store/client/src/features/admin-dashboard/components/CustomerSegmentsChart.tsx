import { Paper, Typography, Box, useTheme, CircularProgress } from '@mui/material'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { useTranslation } from '@hooks/useTranslation'
import type { CustomerSegmentsResponse } from '@features/customer-retention/types'

interface CustomerSegmentsChartProps {
  data: CustomerSegmentsResponse | null
  isLoading?: boolean
}

/**
 * CustomerSegmentsChart Component
 * Displays a pie chart showing customer distribution across different segments
 */
const CustomerSegmentsChart = ({ data, isLoading = false }: CustomerSegmentsChartProps) => {
  const theme = useTheme()
  const { t } = useTranslation()

  // Color palette for pie chart segments
  const SEGMENT_COLORS = {
    new_customers: theme.palette.info.main,
    repeat_customers: theme.palette.primary.main,
    loyal_customers: theme.palette.success.main,
    vip_customers: '#9c27b0', // purple
    at_risk_customers: theme.palette.warning.main,
    churned_customers: theme.palette.error.main,
  }

  // Transform data for recharts
  const chartData = data ? [
    {
      name: t('admin.customerSegments.segments.newCustomers'),
      value: data.segments.new_customers.count,
      percentage: data.segments.new_customers.percentage,
      revenue: data.segments.new_customers.total_revenue,
      avgOrderValue: data.segments.new_customers.avg_order_value,
      color: SEGMENT_COLORS.new_customers,
      description: t('admin.customerSegments.segments.newCustomersDesc'),
    },
    {
      name: t('admin.customerSegments.segments.repeatCustomers'),
      value: data.segments.repeat_customers.count,
      percentage: data.segments.repeat_customers.percentage,
      revenue: data.segments.repeat_customers.total_revenue,
      avgOrderValue: data.segments.repeat_customers.avg_order_value,
      color: SEGMENT_COLORS.repeat_customers,
      description: t('admin.customerSegments.segments.repeatCustomersDesc'),
    },
    {
      name: t('admin.customerSegments.segments.loyalCustomers'),
      value: data.segments.loyal_customers.count,
      percentage: data.segments.loyal_customers.percentage,
      revenue: data.segments.loyal_customers.total_revenue,
      avgOrderValue: data.segments.loyal_customers.avg_order_value,
      color: SEGMENT_COLORS.loyal_customers,
      description: t('admin.customerSegments.segments.loyalCustomersDesc'),
    },
    {
      name: t('admin.customerSegments.segments.vipCustomers'),
      value: data.segments.vip_customers.count,
      percentage: data.segments.vip_customers.percentage,
      revenue: data.segments.vip_customers.total_revenue,
      avgOrderValue: data.segments.vip_customers.avg_order_value,
      color: SEGMENT_COLORS.vip_customers,
      description: t('admin.customerSegments.segments.vipCustomersDesc'),
    },
    {
      name: t('admin.customerSegments.segments.atRisk'),
      value: data.segments.at_risk_customers.count,
      percentage: data.segments.at_risk_customers.percentage,
      lastPurchaseAvgDays: data.segments.at_risk_customers.last_purchase_avg_days,
      color: SEGMENT_COLORS.at_risk_customers,
      description: t('admin.customerSegments.segments.atRiskDesc'),
    },
    {
      name: t('admin.customerSegments.segments.churned'),
      value: data.segments.churned_customers.count,
      percentage: data.segments.churned_customers.percentage,
      lastPurchaseAvgDays: data.segments.churned_customers.last_purchase_avg_days,
      color: SEGMENT_COLORS.churned_customers,
      description: t('admin.customerSegments.segments.churnedDesc'),
    },
  ].filter(segment => segment.value > 0) : []

  // Calculate total customers
  const totalCustomers = chartData.reduce((sum, item) => sum + item.value, 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const segment = payload[0].payload

      return (
        <Paper
          sx={{
            p: 1.5,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {segment.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {segment.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.customerSegments.customers')}: {segment.value.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.customerSegments.percentage')}: {segment.percentage.toFixed(1)}%
          </Typography>
          {segment.revenue !== undefined && (
            <>
              <Typography variant="body2" color="text.secondary">
                {t('admin.customerSegments.revenue')}: ${segment.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.customerSegments.avgOrderValue')}: ${segment.avgOrderValue.toFixed(2)}
              </Typography>
            </>
          )}
          {segment.lastPurchaseAvgDays !== undefined && (
            <Typography variant="body2" color="text.secondary">
              {t('admin.customerSegments.avgDaysSinceLastOrder')}: {segment.lastPurchaseAvgDays.toFixed(0)}
            </Typography>
          )}
        </Paper>
      )
    }
    return null
  }

  // Custom label for pie chart
  const renderLabel = (entry: any) => {
    // Recharts passes label props including 'payload' (data object) and 'percent' (0-1)
    // Access percentage from payload or derive from percent
    const percentage = entry.payload?.percentage ?? (entry.percent ? entry.percent * 100 : 0)
    // Only show label if percentage is significant enough
    return percentage > 5 ? `${percentage.toFixed(1)}%` : ''
  }

  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {t('admin.customerSegments.title')}
      </Typography>
      {!isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('admin.customerSegments.subtitle', { count: totalCustomers })}
        </Typography>
      )}

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
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '0.875rem' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
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
            {t('admin.customerSegments.noData')}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default CustomerSegmentsChart

