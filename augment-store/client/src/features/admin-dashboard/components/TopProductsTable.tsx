import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material'
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import type { TopProductByRevenue } from '@features/admin-dashboard/types'

interface TopProductsTableProps {
  data: TopProductByRevenue[]
  isLoading?: boolean
}

/**
 * TopProductsTable Component
 * Displays a table of top-performing products by revenue
 */
const TopProductsTable = ({ data, isLoading = false }: TopProductsTableProps) => {
  const { t } = useTranslation()
  // Limit to top 10 products - defensive null check to prevent runtime crash
  const topProducts = (data ?? []).slice(0, 10)

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
        <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">
          {t('admin.dashboard.topProducts.title')}
        </Typography>
      </Box>
      {!isLoading && topProducts.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('admin.dashboard.topProducts.showingTop', { count: topProducts.length })}
        </Typography>
      )}

      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
          }}
        >
          <CircularProgress size={40} />
        </Box>
      ) : topProducts.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {t('admin.dashboard.topProducts.rank')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {t('admin.dashboard.topProducts.productName')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {t('admin.dashboard.topProducts.revenue')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {t('admin.dashboard.topProducts.unitsSold')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {t('admin.dashboard.topProducts.price')}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topProducts.map((product, index) => (
                <TableRow
                  key={product.product_id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <TableCell>
                    <Chip
                      label={index + 1}
                      size="small"
                      color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}
                      sx={{ fontWeight: 'bold', minWidth: 32 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {product.product_name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium" color="success.main">
                      ${product.revenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {product.units_sold.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      ${product.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
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
            {t('admin.dashboard.topProducts.noProductData')}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default TopProductsTable

