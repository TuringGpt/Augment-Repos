import { Paper, Typography, Box, useTheme, CircularProgress, Tabs, Tab } from '@mui/material'
import { useState } from 'react'
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
  TrendingDown as TrendingDownIcon,
  RemoveShoppingCart as AbandonmentIcon,
  ShowChart as ConversionIcon,
  TrendingUp as EngagementIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import type { ProductPerformanceResponse } from '@features/product-statistics/types'

interface ProductPerformanceChartProps {
  data: ProductPerformanceResponse | null
  isLoading?: boolean
}

/**
 * ProductPerformanceChart Component
 * Displays product performance metrics in different categories with tabs
 */
const ProductPerformanceChart = ({ data, isLoading = false }: ProductPerformanceChartProps) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Transform data for each category
  const lowPerformingData = (data?.low_performing_products || []).map((product) => ({
    name: product.product_name.length > 20 
      ? `${product.product_name.substring(0, 20)}...` 
      : product.product_name,
    fullName: product.product_name,
    value: product.purchase_count,
    views: product.view_count,
    cartAdds: product.cart_add_count,
  }))

  const highAbandonmentData = (data?.high_abandonment_products || []).map((product) => ({
    name: product.product_name.length > 20 
      ? `${product.product_name.substring(0, 20)}...` 
      : product.product_name,
    fullName: product.product_name,
    value: product.abandonment_rate,
    cartAdds: product.cart_add_count,
    abandonments: product.abandonment_count,
  }))

  const lowConversionData = (data?.low_conversion_products || []).map((product) => ({
    name: product.product_name.length > 20 
      ? `${product.product_name.substring(0, 20)}...` 
      : product.product_name,
    fullName: product.product_name,
    value: product.conversion_rate,
    views: product.view_count,
    purchases: product.purchase_count,
  }))

  const highEngagementData = (data?.high_engagement_products || []).map((product) => ({
    name: product.product_name.length > 20 
      ? `${product.product_name.substring(0, 20)}...` 
      : product.product_name,
    fullName: product.product_name,
    value: product.engagement_ratio,
    views: product.view_count,
    purchases: product.purchase_count,
  }))

  const tabs = [
    { label: t('admin.productPerformance.lowPerforming'), data: lowPerformingData, color: theme.palette.error.main, icon: <TrendingDownIcon /> },
    { label: t('admin.productPerformance.highAbandonment'), data: highAbandonmentData, color: theme.palette.warning.main, icon: <AbandonmentIcon /> },
    { label: t('admin.productPerformance.lowConversion'), data: lowConversionData, color: theme.palette.info.main, icon: <ConversionIcon /> },
    { label: t('admin.productPerformance.highEngagement'), data: highEngagementData, color: theme.palette.success.main, icon: <EngagementIcon /> },
  ]

  const currentTab = tabs[activeTab]

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
          {activeTab === 0 && (
            <>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.purchases')}: {data.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.views')}: {data.views}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.cartAdds')}: {data.cartAdds}
              </Typography>
            </>
          )}
          {activeTab === 1 && (
            <>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.abandonmentRate')}: {data.value.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.cartAdds')}: {data.cartAdds}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.abandonments')}: {data.abandonments}
              </Typography>
            </>
          )}
          {activeTab === 2 && (
            <>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.conversionRate')}: {data.value.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.views')}: {data.views}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.purchases')}: {data.purchases}
              </Typography>
            </>
          )}
          {activeTab === 3 && (
            <>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.engagementRatio')}: {data.value.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.views')}: {data.views}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.productPerformance.purchases')}: {data.purchases}
              </Typography>
            </>
          )}
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
        {currentTab.icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {t('admin.productPerformance.title')}
        </Typography>
      </Box>
      {data && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('admin.productPerformance.subtitle', { days: data.period_days })}
        </Typography>
      )}

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        {tabs.map((tab, index) => (
          <Tab key={index} label={tab.label} />
        ))}
      </Tabs>

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
      ) : currentTab.data.length > 0 ? (
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentTab.data}
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
              >
                {currentTab.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={currentTab.color} />
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
            {t('admin.productPerformance.noData')}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default ProductPerformanceChart

