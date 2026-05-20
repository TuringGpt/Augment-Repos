import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Visibility as ViewIcon,
  ShoppingCart as CartIcon,
  RemoveShoppingCart as RemoveCartIcon,
  ShoppingBag as PurchaseIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { useProductStore } from '@store/productStore'
import { useTranslation } from '@hooks/useTranslation'
import { MetricCard } from '@features/admin-dashboard/components'
import { formatCurrency } from '@utils/formatters'
import { ROUTES } from '@constants/index'

/**
 * Translate error codes to user-friendly messages
 * Maps error codes from the store to translation keys
 */
const translateErrorCode = (errorCode: string, translateFn: (key: string) => string): string => {
  const errorKeyMap: Record<string, string> = {
    'PRODUCT_STATISTICS_LOAD_ERROR': 'productStatistics.detail.errorLoadStatistics',
    'PRODUCT_STATISTICS_PERMISSION_DENIED': 'productStatistics.detail.errorPermissionDenied',
    'PRODUCT_STATISTICS_AUTH_REQUIRED': 'productStatistics.detail.errorAuthRequired',
  }

  // If error code matches a known key, translate it
  const translationKey = errorKeyMap[errorCode]
  if (translationKey) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return translateFn(translationKey as any)
  }

  // Otherwise, return the error code as-is (may be a backend message or network error)
  return errorCode
}

const ProductStatisticsDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    fetchProductStatistics,
    getProductStatistics,
    isLoadingStatistics,
    getStatisticsError,
  } = useProductStore()

  const statistics = id ? getProductStatistics(id) : null
  const isLoading = id ? isLoadingStatistics(id) : false
  const error = id ? getStatisticsError(id) : null

  useEffect(() => {
    const loadStatistics = async () => {
      if (!id) return

      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        setLoading(true)
        await fetchProductStatistics(id, abortController.signal)
      } catch (error: unknown) {
        // Ignore abort errors - they're expected during navigation
        const err = error as { name?: string }
        if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
          return
        }
        // Other errors are handled by the store
      } finally {
        // Only update loading state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadStatistics()

    // Cleanup: abort request on unmount or when id changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [id, fetchProductStatistics])

  const handleBack = () => {
    navigate(ROUTES.ADMIN_PRODUCTS_STATISTICS)
  }

  const handleViewProduct = () => {
    if (id) {
      navigate(ROUTES.PRODUCT_DETAIL.replace(':id', id))
    }
  }

  if (!id) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{t('productStatistics.detail.noProductId')}</Alert>
      </Container>
    )
  }

  if (loading || isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {translateErrorCode(error, t)}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          {t('common.back')}
        </Button>
      </Container>
    )
  }

  if (!statistics) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('productStatistics.detail.notFound')}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          {t('common.back')}
        </Button>
      </Container>
    )
  }

  // Calculate metrics
  const conversionRate = statistics.view_count > 0
    ? ((statistics.purchase_count / statistics.view_count) * 100).toFixed(2)
    : '0.00'

  const cartConversionRate = statistics.cart_add_count > 0
    ? ((statistics.purchase_count / statistics.cart_add_count) * 100).toFixed(2)
    : '0.00'

  const abandonmentRate = statistics.cart_add_count > 0
    ? ((statistics.cart_remove_count / statistics.cart_add_count) * 100).toFixed(2)
    : '0.00'

  const netCartAdditions = statistics.cart_add_count - statistics.cart_remove_count

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          {t('common.back')}
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {statistics.product_name}
            </Typography>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
              {formatCurrency(parseFloat(statistics.product_price))}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={handleViewProduct}
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('productStatistics.detail.viewProduct')}
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title={t('productStatistics.detail.metrics.views')}
            value={statistics.view_count.toLocaleString()}
            icon={<ViewIcon />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title={t('productStatistics.detail.metrics.cartAdditions')}
            value={statistics.cart_add_count.toLocaleString()}
            icon={<CartIcon />}
            color="primary.main"
            subtitle={`${t('productStatistics.detail.metrics.netAdditions')}: ${netCartAdditions.toLocaleString()}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title={t('productStatistics.detail.metrics.cartRemovals')}
            value={statistics.cart_remove_count.toLocaleString()}
            icon={<RemoveCartIcon />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title={t('productStatistics.detail.metrics.purchases')}
            value={statistics.purchase_count.toLocaleString()}
            icon={<PurchaseIcon />}
            color="success.main"
          />
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUpIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('productStatistics.detail.performanceMetrics')}
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('productStatistics.detail.metrics.conversionRate')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {conversionRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('productStatistics.detail.metrics.viewsToPurchases')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('productStatistics.detail.metrics.cartConversionRate')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {cartConversionRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('productStatistics.detail.metrics.cartToPurchases')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('productStatistics.detail.metrics.abandonmentRate')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {abandonmentRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('productStatistics.detail.metrics.cartRemovals')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('productStatistics.detail.metrics.engagementScore')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {statistics.view_count > 0
                  ? ((statistics.cart_add_count / statistics.view_count) * 100).toFixed(2)
                  : '0.00'}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('productStatistics.detail.metrics.viewsToCart')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Statistics */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          {t('productStatistics.detail.summary')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('productStatistics.detail.totalRevenue')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                {formatCurrency(parseFloat(statistics.product_price) * statistics.purchase_count)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('productStatistics.detail.averageOrderValue')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {formatCurrency(parseFloat(statistics.product_price))}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}

export default ProductStatisticsDetailPage

