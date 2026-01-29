import { Paper, Typography, Box, useTheme, CircularProgress, Grid } from '@mui/material'
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
import {
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
  ShoppingBag as ShoppingBagIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import type { GeneralStatisticsResponse } from '@features/admin-reports/types'

interface GeneralStatisticsChartProps {
  data: GeneralStatisticsResponse | null
  isLoading?: boolean
}

/**
 * GeneralStatisticsChart Component
 * Displays general statistics with metric cards and a bar chart
 */
const GeneralStatisticsChart = ({ data, isLoading = false }: GeneralStatisticsChartProps) => {
  const theme = useTheme()
  const { t } = useTranslation()

  // Transform data for recharts
  const chartData = data
    ? [
        {
          name: t('admin.reportsPage.generalStats.views'),
          value: data.total_views,
          color: theme.palette.info.main,
        },
        {
          name: t('admin.reportsPage.generalStats.cartAdditions'),
          value: data.total_cart_additions,
          color: theme.palette.warning.main,
        },
        {
          name: t('admin.reportsPage.generalStats.purchases'),
          value: data.total_purchases,
          color: theme.palette.success.main,
        },
      ]
    : []

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
            {t('admin.reportsPage.generalStats.count')}: {data.value.toLocaleString()}
          </Typography>
        </Paper>
      )
    }
    return null
  }

  // Metric cards data
  const metrics = data
    ? [
        {
          title: t('admin.reportsPage.generalStats.totalProducts'),
          value: data.total_products_tracked.toLocaleString(),
          icon: <InventoryIcon sx={{ fontSize: 32 }} />,
          color: theme.palette.primary.main,
        },
        {
          title: t('admin.reportsPage.generalStats.totalViews'),
          value: data.total_views.toLocaleString(),
          icon: <VisibilityIcon sx={{ fontSize: 32 }} />,
          color: theme.palette.info.main,
        },
        {
          title: t('admin.reportsPage.generalStats.totalCartAdditions'),
          value: data.total_cart_additions.toLocaleString(),
          icon: <ShoppingCartIcon sx={{ fontSize: 32 }} />,
          color: theme.palette.warning.main,
        },
        {
          title: t('admin.reportsPage.generalStats.totalPurchases'),
          value: data.total_purchases.toLocaleString(),
          icon: <ShoppingBagIcon sx={{ fontSize: 32 }} />,
          color: theme.palette.success.main,
        },
      ]
    : []

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
        {t('admin.reportsPage.generalStats.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('admin.reportsPage.generalStats.subtitle')}
      </Typography>

      {/* Show loading spinner when actively loading OR when no data exists yet (initial state) */}
      {isLoading || !data ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
          }}
        >
          {isLoading ? (
            <CircularProgress size={40} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('admin.reportsPage.generalStats.noData')}
            </Typography>
          )}
        </Box>
      ) : (
        <>
          {/* Metric Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {metrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box sx={{ color: metric.color }}>{metric.icon}</Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {metric.title}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: metric.color }}>
                      {metric.value}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Bar Chart */}
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </Paper>
  )
}


export default GeneralStatisticsChart

