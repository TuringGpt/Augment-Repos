import { Paper, Typography, Box, useTheme, CircularProgress } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import type { ProductStatisticsItem } from '@features/product-statistics/types'

interface MostAddedToCartChartProps {
  data: ProductStatisticsItem[]
  isLoading?: boolean
}

/**
 * MostAddedToCartChart Component
 * Displays a bar chart showing the most added to cart products by cart add count
 */
const MostAddedToCartChart = ({ data, isLoading = false }: MostAddedToCartChartProps) => {
  const theme = useTheme()
  const { t } = useTranslation()

  // Transform data for recharts
  const chartData = data.map((product) => ({
    name: product.product_name.length > 20 
      ? `${product.product_name.substring(0, 20)}...` 
      : product.product_name,
    fullName: product.product_name,
    cartAdds: product.cart_add_count,
    price: parseFloat(product.product_price),
  }))

  // Generate colors based on theme
  const getBarColor = (index: number) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.error.main,
    ]
    return colors[index % colors.length]
  }

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
            {data.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.productStatistics.mostAddedToCart.cartAdds')}: {data.cartAdds.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.productStatistics.mostAddedToCart.price')}: ${data.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
        <ShoppingCartIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">
          {t('admin.productStatistics.mostAddedToCart.title')}
        </Typography>
      </Box>
      {!isLoading && chartData.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('admin.productStatistics.mostAddedToCart.subtitle', { count: chartData.length })}
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
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="name"
                stroke={theme.palette.text.secondary}
                style={{ fontSize: '0.75rem' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke={theme.palette.text.secondary}
                style={{ fontSize: '0.875rem' }}
                label={{
                  value: t('admin.productStatistics.mostAddedToCart.cartAddCount'),
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="cartAdds"
                radius={[8, 8, 0, 0]}
              >
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
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
            height: 300,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('admin.productStatistics.mostAddedToCart.noData')}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default MostAddedToCartChart

