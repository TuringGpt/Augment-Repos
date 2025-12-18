import { Paper, Typography, Box, useTheme } from '@mui/material'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import type { CategoryPerformance } from '@features/admin-dashboard/types'

interface CategoryPerformanceChartProps {
  data: CategoryPerformance[]
  isLoading?: boolean
}

/**
 * CategoryPerformanceChart Component
 * Displays a pie chart showing revenue distribution across product categories
 */
const CategoryPerformanceChart = ({ data, isLoading = false }: CategoryPerformanceChartProps) => {
  const theme = useTheme()

  // Color palette for pie chart segments
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#9c27b0', // purple
    '#ff9800', // orange
    '#795548', // brown
    '#607d8b', // blue grey
  ]

  // Transform data for recharts
  const chartData = data.map((category) => ({
    name: category.category_name,
    value: category.revenue,
    units: category.units_sold,
    orders: category.orders,
  }))

  // Calculate total revenue for percentage calculation
  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = totalRevenue > 0 ? (data.value / totalRevenue) * 100 : 0
      
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
            Revenue: ${data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: {percentage.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Units Sold: {data.units.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Orders: {data.orders.toLocaleString()}
          </Typography>
        </Paper>
      )
    }
    return null
  }

  // Custom label for pie chart
  const renderLabel = (entry: any) => {
    const percentage = totalRevenue > 0 ? (entry.value / totalRevenue) * 100 : 0
    // Only show label if percentage is significant enough
    return percentage > 5 ? `${percentage.toFixed(1)}%` : ''
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
        Revenue by Category
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Distribution across {data.length} categories
      </Typography>

      {chartData.length > 0 ? (
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            No category data available
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default CategoryPerformanceChart

