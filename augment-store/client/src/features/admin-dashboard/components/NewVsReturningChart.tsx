import { Paper, Typography, Box, useTheme, CircularProgress } from '@mui/material'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
 * Displays a stacked area chart showing new vs returning customers over time
 */
const NewVsReturningChart = ({ data, isLoading = false }: NewVsReturningChartProps) => {
  const theme = useTheme()
  const { t } = useTranslation()

  // Transform time series data for recharts
  const chartData = data?.time_series?.map((period) => ({
    period: period.period,
    newCustomers: period.new_customers,
    returningCustomers: period.returning_customers,
    totalCustomers: period.total_customers,
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
            {data.period}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.newVsReturning.newCustomers')}: {data.newCustomers.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.newVsReturning.returningCustomers')}: {data.returningCustomers.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.newVsReturning.total')}: {data.totalCustomers.toLocaleString()}
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
      ) : chartData.length > 0 ? (
        <>
          {/* Summary Metrics */}
          {data && (
            <Box sx={{ mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.newVsReturning.totalNewCustomers')}
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="info.main">
                  {data.total_new_customers.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.newVsReturning.totalReturningCustomers')}
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {data.total_returning_customers.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.newVsReturning.newCustomerRate')}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {data.new_customers_percentage.toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.newVsReturning.returningCustomerRate')}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {data.returning_customers_percentage.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          )}

          {/* Chart */}
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="period"
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.75rem' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke={theme.palette.text.secondary}
                  style={{ fontSize: '0.875rem' }}
                  label={{ value: 'Customers', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                <Area
                  type="monotone"
                  dataKey="newCustomers"
                  name={t('admin.newVsReturning.newCustomers')}
                  stackId="1"
                  stroke={theme.palette.info.main}
                  fill={theme.palette.info.main}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="returningCustomers"
                  name={t('admin.newVsReturning.returningCustomers')}
                  stackId="1"
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.main}
                  fillOpacity={0.6}
                />
              </AreaChart>
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

