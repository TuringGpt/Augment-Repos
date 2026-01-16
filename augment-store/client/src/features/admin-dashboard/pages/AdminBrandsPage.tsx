import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Storefront as BrandIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useBrandStore } from '@store/brandStore'

/**
 * AdminBrandsPage Component
 * Admin page for viewing and managing brands
 */
const AdminBrandsPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()

  // Use brand store
  const { brands, isLoading, error, fetchBrands } = useBrandStore()

  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load brands
  const loadBrands = async () => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    // Fetch brands using the store
    await fetchBrands(abortControllerRef.current.signal)
  }

  // Fetch brands on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadBrands()
    }

    return () => {
      // Cleanup: abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role])

  const handleRefresh = () => {
    loadBrands()
  }

  // Check if user is authenticated and is an admin
  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('admin.dashboard.pleaseLogin')}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          {t('admin.dashboard.goToLogin')}
        </Button>
      </Container>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('admin.dashboard.accessDenied')}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('admin.dashboard.goToHome')}
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            {t('admin.brandsPage.title')}
          </Typography>
          <Typography color="text.secondary">
            {t('admin.brandsPage.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('admin.brandsPage.refresh')}>
            <IconButton onClick={handleRefresh} color="primary" disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('admin.brandsPage.errorLoadBrands')}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && brands.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : brands.length > 0 ? (
        /* Brands Table */
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.brandsPage.table.image')}</TableCell>
                  <TableCell>{t('admin.brandsPage.table.brandName')}</TableCell>
                  <TableCell>{t('admin.brandsPage.table.description')}</TableCell>
                  <TableCell align="center">{t('admin.brandsPage.table.id')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow
                    key={brand.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    {/* Brand Image */}
                    <TableCell>
                      {brand.image ? (
                        <Avatar
                          src={brand.image}
                          alt={brand.name}
                          variant="rounded"
                          sx={{ width: 56, height: 56 }}
                        />
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{ width: 56, height: 56, bgcolor: 'grey.200' }}
                        >
                          <BrandIcon sx={{ color: 'grey.400' }} />
                        </Avatar>
                      )}
                    </TableCell>

                    {/* Brand Name */}
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {brand.name}
                      </Typography>
                    </TableCell>

                    {/* Description */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {brand.description || '-'}
                      </Typography>
                    </TableCell>

                    {/* ID */}
                    <TableCell align="center">
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          bgcolor: 'grey.100',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                        }}
                      >
                        {brand.id.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('admin.brandsPage.noBrands')}
          </Typography>
        </Paper>
      )}
    </Container>
  )
}

export default AdminBrandsPage

