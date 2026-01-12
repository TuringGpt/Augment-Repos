import { useEffect, useState, useRef } from 'react'
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
  Category as CategoryIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { productService } from '@services/api/products/productService'
import type { Category } from '@features/products/types'

/**
 * AdminCategoriesPage Component
 * Admin page for viewing and managing categories
 */
const AdminCategoriesPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<boolean>(false)
  
  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load categories
  const loadCategories = async () => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(false)

    try {
      const fetchedCategories = await productService.getCategories(
        abortControllerRef.current.signal
      )
      setCategories(fetchedCategories)
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts or request is cancelled
      const error = err as { name?: string }
      if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
        return
      }

      console.error('Failed to fetch categories:', err)
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch categories on mount
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadCategories()
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
    loadCategories()
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
            {t('admin.categoriesPage.title')}
          </Typography>
          <Typography color="text.secondary">
            {t('admin.categoriesPage.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('admin.categoriesPage.refresh')}>
            <IconButton onClick={handleRefresh} color="primary" disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(false)}>
          {t('admin.categoriesPage.errorLoadCategories')}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && categories.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : categories.length > 0 ? (
        /* Categories Table */
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.categoriesPage.table.image')}</TableCell>
                  <TableCell>{t('admin.categoriesPage.table.categoryName')}</TableCell>
                  <TableCell>{t('admin.categoriesPage.table.description')}</TableCell>
                  <TableCell>{t('admin.categoriesPage.table.parentCategory')}</TableCell>
                  <TableCell align="center">{t('admin.categoriesPage.table.id')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow
                    key={category.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    {/* Category Image */}
                    <TableCell>
                      {category.image ? (
                        <Avatar
                          src={category.image}
                          alt={category.name}
                          variant="rounded"
                          sx={{ width: 56, height: 56 }}
                        />
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{ width: 56, height: 56, bgcolor: 'grey.200' }}
                        >
                          <CategoryIcon sx={{ color: 'grey.400' }} />
                        </Avatar>
                      )}
                    </TableCell>

                    {/* Category Name */}
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {category.name}
                      </Typography>
                    </TableCell>

                    {/* Description */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {category.description || '-'}
                      </Typography>
                    </TableCell>

                    {/* Parent Category */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {category.parent || '-'}
                      </Typography>
                    </TableCell>

                    {/* ID */}
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {category.id}
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
            {t('admin.categoriesPage.noCategories')}
          </Typography>
        </Paper>
      )}
    </Container>
  )
}

export default AdminCategoriesPage

