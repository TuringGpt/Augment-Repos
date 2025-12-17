import { Paper, Typography, Box, useTheme } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ConversionFunnel } from '@features/admin-dashboard/types'

interface ConversionFunnelChartProps {
  data: ConversionFunnel
  isLoading?: boolean
}

/**
 * ConversionFunnelChart Component
 * Displays a bar chart showing the conversion funnel from views to purchases
 */
const ConversionFunnelChart = ({ data, isLoading = false }: ConversionFunnelChartProps) => {
  const theme = useTheme()

  // Transform data for recharts
  const chartData = [
    {
      name: 'Views',
      count: data.total_views,
      rate: 100,
      color: theme.palette.info.main,
    },
    {
      name: 'Cart Additions',
      count: data.total_cart_additions,
      rate: data.view_to_cart_rate,
      color: theme.palette.warning.main,
    },
    {
      name: 'Purchases',
      count: data.total_purchases,
      rate: data.cart_to_purchase_rate,
      color: theme.palette.success.main,
    },
  ]

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
          <Typography variant="body2" fontWeight="bold">
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Count: {data.count.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rate: {data.rate.toFixed(2)}%
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
      <Typography variant="h6" gutterBottom>
        Conversion Funnel
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Overall conversion rate: {data.overall_conversion_rate.toFixed(2)}%
      </Typography>

      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="name"
              stroke={theme.palette.text.secondary}
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              style={{ fontSize: '0.875rem' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.875rem' }}
              iconType="circle"
            />
            <Bar
              dataKey="count"
              name="Count"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

export default ConversionFunnelChart

