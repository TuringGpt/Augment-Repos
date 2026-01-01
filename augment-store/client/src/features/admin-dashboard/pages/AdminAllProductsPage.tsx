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
  TablePagination,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Drawer,
  Divider,
  Grid,
  MenuItem,
  Snackbar,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useDebounce } from '@hooks/useDebounce'
import { useAuthStore } from '@store/authStore'
import { formatCurrency } from '@utils/formatters'
import { productService } from '@services/api/products/productService'
import type { Product } from '@features/products/types'

/**
 * AdminAllProductsPage Component
 * Admin page for viewing and managing all products
 */
const AdminAllProductsPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
  })

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  // Computed loading state - true if either products or search is loading
  const isLoading = isLoadingProducts || isLoadingSearch

  // Backend has fixed page size of 100
  const backendPageSize = 100

  // Track the latest search query to prevent race conditions
  const latestSearchQueryRef = useRef<string>('')

  // Debounce search query with 500ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Invalidate latest search query ref immediately when search query is cleared
  // This prevents in-flight requests from "winning" when the field is empty
  // Also reset search mode and loading state immediately for instant UI feedback
  useEffect(() => {
    if (!searchQuery.trim()) {
      latestSearchQueryRef.current = ''
      // Immediately exit search mode and clear search loading state
      // This ensures the UI updates right away (pagination shows, helper text changes)
      // rather than waiting for the debounce to fire
      setIsSearchMode(false)
      setIsLoadingSearch(false)
      setSearchError(null)
    }
  }, [searchQuery])

  // Fetch products on mount and when page changes (only if not in search mode)
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && !isSearchMode) {
      loadProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isAuthenticated, user?.role, isSearchMode])

  // Trigger search when debounced search query changes
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      handleDebouncedSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, isAuthenticated, user?.role])

  const loadProducts = async () => {
    setIsLoadingProducts(true)
    setProductsError(null)

    try {
      const response = await productService.getProducts({
        page: page + 1, // API uses 1-based pagination
      })

      setProducts(response.products)
      setTotalProducts(response.total)
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setProductsError(t('admin.allProducts.errorLoadProducts'))
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    // Prevent page changes in search mode since search doesn't support pagination
    if (isSearchMode) {
      return
    }
    setPage(newPage)
  }

  const handleRefresh = () => {
    setIsSearchMode(false)
    setSearchQuery('')
    setPage(0)
    // Force reload if already on page 0 and not in search mode
    if (page === 0 && !isSearchMode) {
      loadProducts()
    }
  }

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category.id,
    })
    setIsEditDrawerOpen(true)
  }

  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false)
    setSelectedProduct(null)
    setEditFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
    })
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveProduct = () => {
    // TODO: Implement actual save functionality
    console.log('Saving product:', selectedProduct?.id, editFormData)
    // Show success message via snackbar
    setSnackbarMessage(t('admin.allProducts.form.saveSuccess'))
    setSnackbarOpen(true)
    handleCloseEditDrawer()
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  const handleDebouncedSearch = async () => {
    const trimmedQuery = debouncedSearchQuery.trim()

    // Update the latest search query ref to track this request
    latestSearchQueryRef.current = trimmedQuery

    if (!trimmedQuery) {
      // Clear search loading state only - don't interfere with products loading
      setIsLoadingSearch(false)
      // Clear only search errors when leaving search mode
      // Don't clear productsError to avoid hiding unrelated products-load errors
      setSearchError(null)
      // Clear search mode and reload normal products
      if (isSearchMode) {
        setIsSearchMode(false)
        setPage(0)
      }
      return
    }

    setIsLoadingSearch(true)
    setSearchError(null)

    try {
      const response = await productService.searchProducts(trimmedQuery, {
        limit: 100,
      })

      // Only update state if this is still the latest search query
      // This prevents race conditions where a slower earlier request
      // could overwrite results from a faster later request
      if (latestSearchQueryRef.current === trimmedQuery) {
        setProducts(response.products)
        // In search mode, we only show the results we fetched (no pagination)
        // Don't use response.total since we can't paginate through all results
        setTotalProducts(response.products.length)
        setIsSearchMode(true)
        // Set page to 0 without triggering loadProducts due to isSearchMode=true
        setPage(0)
      }
      // Otherwise, discard stale results
    } catch (err) {
      console.error('Failed to search products:', err)
      // Only show error if this is still the latest search query
      if (latestSearchQueryRef.current === trimmedQuery) {
        setSearchError(t('admin.allProducts.errorSearchProducts'))
      }
    } finally {
      // Only update loading state if this is still the latest search query
      if (latestSearchQueryRef.current === trimmedQuery) {
        setIsLoadingSearch(false)
      }
    }
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            {t('admin.allProducts.title')}
          </Typography>
          <Typography color="text.secondary">
            {t('admin.allProducts.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('admin.allProducts.refresh')}>
            <IconButton onClick={handleRefresh} color="primary" disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/products/create')}
          >
            {t('admin.allProducts.addProduct')}
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t('admin.allProducts.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoadingProducts}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: isLoading && searchQuery && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
          helperText={
            isSearchMode
              ? t('admin.allProducts.searchResults', { count: products.length })
              : t('admin.allProducts.searchHelperText')
          }
        />
      </Box>

      {/* Products Error Alert */}
      {productsError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setProductsError(null)}>
          {productsError}
        </Alert>
      )}

      {/* Search Error Alert */}
      {searchError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSearchError(null)}>
          {searchError}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && products.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : products.length > 0 ? (
        <Box sx={{ position: 'relative' }}>
          {/* Loading overlay for pagination changes */}
          {isLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* Products Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.allProducts.table.image')}</TableCell>
                  <TableCell>{t('admin.allProducts.table.productName')}</TableCell>
                  <TableCell>{t('admin.allProducts.table.category')}</TableCell>
                  <TableCell align="right">{t('admin.allProducts.table.price')}</TableCell>
                  <TableCell align="right">{t('admin.allProducts.table.stock')}</TableCell>
                  <TableCell align="center">{t('admin.allProducts.table.rating')}</TableCell>
                  <TableCell align="center">{t('admin.allProducts.table.status')}</TableCell>
                  <TableCell align="center">{t('admin.allProducts.table.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Avatar
                          src={product.images[0]}
                          alt={product.name}
                          variant="rounded"
                          sx={{ width: 60, height: 60 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {product.category.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {product.discountPrice ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(product.discountPrice)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ textDecoration: 'line-through' }}
                            >
                              {formatCurrency(product.price)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(product.price)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {product.stock}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Typography variant="body2">
                            {product.rating.toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({product.reviewCount})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={product.stock > 0 ? t('admin.allProducts.table.inStock') : t('admin.allProducts.table.outOfStock')}
                          color={product.stock > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title={t('admin.allProducts.table.viewProduct')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewProduct(product.id)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('admin.allProducts.table.editProduct')}>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleEditProduct(product)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('admin.allProducts.table.deleteProduct')}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                // TODO: Implement delete functionality
                                console.log('Delete product:', product.id)
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {t('admin.allProducts.noProducts')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination - Only shown when not in search mode */}
          {!isSearchMode && (
            <TablePagination
              component="div"
              count={totalProducts}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={backendPageSize}
              rowsPerPageOptions={[backendPageSize]}
              labelRowsPerPage={t('admin.allProducts.productsPerPage')}
            />
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('admin.allProducts.noProductsAvailable')}
          </Typography>
        </Paper>
      )}

      {/* Edit Product Drawer */}
      <Drawer
        anchor="right"
        open={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 500, md: 600 },
            maxWidth: '100%',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.allProducts.editProduct')}
            </Typography>
            <IconButton onClick={handleCloseEditDrawer} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {selectedProduct && (
              <Grid container spacing={3}>
                {/* Product Image Preview */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Avatar
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      variant="rounded"
                      sx={{ width: 120, height: 120 }}
                    />
                  </Box>
                </Grid>

                {/* Product Name */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.allProducts.form.productName')}
                    value={editFormData.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    required
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.allProducts.form.description')}
                    value={editFormData.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    multiline
                    rows={4}
                    required
                  />
                </Grid>

                {/* Price */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('admin.allProducts.form.price')}
                    value={editFormData.price}
                    onChange={(e) => handleEditFormChange('price', e.target.value)}
                    type="number"
                    required
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                  />
                </Grid>

                {/* Stock */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('admin.allProducts.form.stock')}
                    value={editFormData.stock}
                    onChange={(e) => handleEditFormChange('stock', e.target.value)}
                    type="number"
                    required
                  />
                </Grid>

                {/* Category */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label={t('admin.allProducts.form.category')}
                    value={editFormData.category}
                    onChange={(e) => handleEditFormChange('category', e.target.value)}
                    required
                  >
                    <MenuItem value={selectedProduct.category.id}>
                      {selectedProduct.category.name}
                    </MenuItem>
                    {/* TODO: Add more categories from API */}
                  </TextField>
                </Grid>

                {/* Product Info */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('admin.allProducts.form.productId')}: {selectedProduct.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('admin.allProducts.form.rating')}: {selectedProduct.rating.toFixed(1)} ({selectedProduct.reviewCount} {t('admin.allProducts.form.reviews')})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.allProducts.form.createdAt')}: {new Date(selectedProduct.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Box>

          {/* Footer Actions */}
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="outlined"
              onClick={handleCloseEditDrawer}
            >
              {t('admin.allProducts.form.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveProduct}
            >
              {t('admin.allProducts.form.save')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default AdminAllProductsPage

