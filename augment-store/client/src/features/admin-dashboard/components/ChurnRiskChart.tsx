import {
  Paper,
  Typography,
  Box,
  useTheme,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
} from '@mui/material'
import {
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import { parseISO, format } from 'date-fns'
import { enUS, es, fr, de } from 'date-fns/locale'
import { useTranslation } from '@hooks/useTranslation'
import type { ChurnRiskResponse } from '@features/customer-retention/types'

interface ChurnRiskChartProps {
  data: ChurnRiskResponse | null
  isLoading?: boolean
}

// Map i18n language codes to date-fns locales
const localeMap = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
}

/**
 * ChurnRiskChart Component
 * Displays customers at risk of churning with risk levels and metrics
 */
const ChurnRiskChart = ({ data, isLoading = false }: ChurnRiskChartProps) => {
  const theme = useTheme()
  const { t, i18n } = useTranslation()

  // Get the current locale for date formatting
  const currentLocale = localeMap[i18n.language as keyof typeof localeMap] || enUS

  // Get risk level color
  const getRiskColor = (riskLevel: 'high' | 'medium') => {
    return riskLevel === 'high' ? theme.palette.error.main : theme.palette.warning.main
  }

  // Format date - using parseISO for timezone-stable parsing of YYYY-MM-DD dates
  // and respecting the user's selected language for date formatting
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)
    return format(date, 'PPP', { locale: currentLocale })
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('admin.churnRisk.title')}
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
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
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
                <TrendingDownIcon sx={{ fontSize: 32, color: 'error.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.churnRisk.summary.totalAtRisk')}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: 'error.main' }}>
                    {data.summary.total_at_risk.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
                <Box sx={{ color: 'error.main' }}>
                  <Typography variant="h6" fontWeight={700}>
                    {data.summary.high_risk.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.churnRisk.summary.highRisk')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
                <Box sx={{ color: 'warning.main' }}>
                  <Typography variant="h6" fontWeight={700}>
                    {data.summary.medium_risk.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.churnRisk.summary.mediumRisk')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('admin.churnRisk.summary.potentialRevenueAtRisk')}
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'error.main' }}>
                  ${data.summary.potential_revenue_at_risk.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* At-Risk Customers Table */}
          {data.at_risk_customers.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.churnRisk.table.customer')}</TableCell>
                    <TableCell>{t('admin.churnRisk.table.riskLevel')}</TableCell>
                    <TableCell align="right">{t('admin.churnRisk.table.daysInactive')}</TableCell>
                    <TableCell align="right">{t('admin.churnRisk.table.lastPurchase')}</TableCell>
                    <TableCell align="right">{t('admin.churnRisk.table.lifetimeOrders')}</TableCell>
                    <TableCell align="right">{t('admin.churnRisk.table.lifetimeRevenue')}</TableCell>
                    <TableCell align="right">{t('admin.churnRisk.table.avgDaysBetweenOrders')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.at_risk_customers.map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {customer.customer_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.customer_email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t(`admin.churnRisk.riskLevels.${customer.risk_level}`)}
                          size="small"
                          sx={{
                            bgcolor: getRiskColor(customer.risk_level),
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="error.main" fontWeight="medium">
                          {customer.days_since_last_purchase}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatDate(customer.last_purchase_date)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{customer.total_lifetime_orders}</TableCell>
                      <TableCell align="right">
                        ${customer.total_lifetime_revenue.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {customer.previous_avg_days_between_orders > 0
                          ? customer.previous_avg_days_between_orders.toFixed(0)
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('admin.churnRisk.noData')}
              </Typography>
            </Box>
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
            {t('admin.churnRisk.noData')}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default ChurnRiskChart

