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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Autocomplete,
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
import { useToast } from '@hooks/useToast'
import { useAuthStore } from '@store/authStore'
import { useProductStore } from '@store/productStore'
import { formatCurrency } from '@utils/formatters'
import { productService } from '@services/api/products/productService'
import type { Product, Brand, Category } from '@features/products/types'

/**
 * Helper function to translate error codes from the store
 * Maps error codes to translation keys
 */
const getErrorMessage = (errorCode: string | null, translateFn: ReturnType<typeof useTranslation>['t']): string | null => {
  if (!errorCode) return null

  // Map error codes to translation keys
  const errorKeyMap: Record<string, string> = {
    'PRODUCTS_LOAD_ERROR': 'admin.allProducts.errorLoadProducts',
    'PRODUCTS_PERMISSION_DENIED': 'admin.allProducts.errorPermissionDenied',
    'PRODUCTS_AUTH_REQUIRED': 'admin.allProducts.errorAuthRequired',
    'PRODUCT_DELETE_ERROR': 'admin.allProducts.errorDeleteProduct',
    'PRODUCT_DELETE_PERMISSION_DENIED': 'admin.allProducts.errorDeletePermissionDenied',
    'PRODUCT_DELETE_AUTH_REQUIRED': 'admin.allProducts.errorDeleteAuthRequired',
    'PRODUCT_UPDATE_ERROR': 'admin.allProducts.errorUpdateProduct',
    'PRODUCT_UPDATE_PERMISSION_DENIED': 'admin.allProducts.errorUpdatePermissionDenied',
    'PRODUCT_UPDATE_AUTH_REQUIRED': 'admin.allProducts.errorUpdateAuthRequired',
    'PRODUCT_NOT_FOUND': 'admin.allProducts.errorProductNotFound',
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

/**
 * AdminAllProductsPage Component
 * Admin page for viewing and managing all products
 */
const AdminAllProductsPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toast = useToast()
  const { user, isAuthenticated } = useAuthStore()

  // Product store state and actions
  const {
    products: storeProducts,
    total: storeTotal,
    page: storePage,
    isLoading: isLoadingProducts,
    error: productsError,
    fetchProducts,
    deleteProduct: deleteProductFromStore,
    updateProduct: updateProductInStore,
    setError: setProductsError,
  } = useProductStore()

  // Local state for search functionality
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchResultsCount, setSearchResultsCount] = useState(0)

  // Delete confirmation modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Computed values - use search results when in search mode, otherwise use store products
  const products = isSearchMode ? searchResults : storeProducts
  const totalProducts = isSearchMode ? searchResultsCount : storeTotal
  const page = isSearchMode ? 0 : storePage - 1 // Convert from 1-based to 0-based for MUI pagination

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    name?: string
    description?: string
    price?: string
    stock?: string
  }>({})

  // Create drawer state
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    brandId: '',
    categoryId: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [createFormErrors, setCreateFormErrors] = useState<{
    name?: string
    description?: string
    price?: string
    quantity?: string
    brandId?: string
    categoryId?: string
  }>({})

  // Brands and categories for create form
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([])
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [isLoadingBrands, setIsLoadingBrands] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Computed loading state - true if either products or search is loading
  const isLoading = isLoadingProducts || isLoadingSearch

  // Backend has fixed page size of 100
  const backendPageSize = 100

  // Track the latest search query to prevent race conditions
  const latestSearchQueryRef = useRef<string>('')

  // Track if we're manually refreshing to prevent the useEffect from triggering a duplicate fetch
  const isManualRefreshRef = useRef<boolean>(false)

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

  // Fetch products on mount only (pagination is handled by handleChangePage)
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && !isSearchMode) {
      // Skip loading if we're in the middle of a manual refresh
      // This prevents a race condition where handleRefresh triggers both
      // this useEffect and its own fetchProducts call
      if (isManualRefreshRef.current) {
        isManualRefreshRef.current = false
        return
      }
      loadProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role, isSearchMode])

  // Trigger search when debounced search query changes
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      handleDebouncedSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, isAuthenticated, user?.role])

  const loadProducts = () => {
    // Error handling is managed by the store - check productsError state
    void fetchProducts({
      page: storePage, // Store uses 1-based pagination
    })
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    // Prevent page changes in search mode since search doesn't support pagination
    if (isSearchMode) {
      return
    }
    // Fetch products for the new page (convert from 0-based to 1-based)
    // Error handling is managed by the store - check productsError state
    void fetchProducts({ page: newPage + 1 })
  }

  const handleRefresh = () => {
    setSearchQuery('')
    // Set the manual refresh flag to prevent the useEffect from triggering
    // when we change isSearchMode to false
    isManualRefreshRef.current = true
    setIsSearchMode(false)
    // Reload products from page 1
    // Error handling is managed by the store - check productsError state
    void fetchProducts({ page: 1 })
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
    })
    setIsEditDrawerOpen(true)
  }

  const handleCloseEditDrawer = () => {
    // Prevent closing the drawer while a save operation is in progress
    if (isSaving) {
      return
    }
    setIsEditDrawerOpen(false)
    setSelectedProduct(null)
    setEditFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
    })
    setFormErrors({})
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for the field being edited
    if (field === 'name' || field === 'description' || field === 'price' || field === 'stock') {
      setFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  const validateFormData = (): boolean => {
    const errors: { name?: string; description?: string; price?: string; stock?: string } = {}

    // Validate name: must be non-empty
    if (!editFormData.name || editFormData.name.trim() === '') {
      errors.name = t('admin.allProducts.form.errorInvalidName')
    }

    // Validate description: must be non-empty
    if (!editFormData.description || editFormData.description.trim() === '') {
      errors.description = t('admin.allProducts.form.errorInvalidDescription')
    }

    // Validate price: must be a valid positive finite number
    const priceValue = parseFloat(editFormData.price)
    if (!Number.isFinite(priceValue) || priceValue <= 0 || editFormData.price.trim() === '') {
      errors.price = t('admin.allProducts.form.errorInvalidPrice')
    }

    // Validate stock: must be a valid non-negative finite integer
    // Use Number() for consistent parsing to avoid parseInt mis-parsing values like "1e3"
    const stockValue = Number(editFormData.stock)
    if (!Number.isFinite(stockValue) || stockValue < 0 || editFormData.stock.trim() === '' || !Number.isInteger(stockValue)) {
      errors.stock = t('admin.allProducts.form.errorInvalidStock')
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProduct = async () => {
    // Guard against null selectedProduct to avoid state desync issues
    if (!selectedProduct) {
      console.error('Cannot save product: selectedProduct is null')
      return
    }

    // Validate form data before making API call
    if (!validateFormData()) {
      // Validation errors are already set in state and will be displayed
      return
    }

    setIsSaving(true)
    try {
      // Prepare the update data
      const price = parseFloat(editFormData.price)
      // Use Number() for consistent parsing to avoid parseInt mis-parsing values like "1e3"
      const quantity = Number(editFormData.stock)

      // Additional safety guard: ensure parsed values are finite numbers before API call
      if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
        console.error('Invalid numeric values detected:', { price, quantity })
        setFormErrors({
          price: !Number.isFinite(price) ? t('admin.allProducts.form.errorInvalidPrice') : undefined,
          stock: !Number.isFinite(quantity) ? t('admin.allProducts.form.errorInvalidStock') : undefined,
        })
        setIsSaving(false)
        return
      }

      const updateData = {
        name: editFormData.name,
        description: editFormData.description,
        price,
        quantity,
      }

      // Call the store action to update the product
      await updateProductInStore(selectedProduct.id, updateData)

      // If in search mode, also update the search results
      if (isSearchMode) {
        setSearchResults((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id
              ? {
                  ...p,
                  name: updateData.name,
                  description: updateData.description,
                  price: updateData.price,
                  stock: updateData.quantity,
                }
              : p
          )
        )
      }

      // Show success message via toast
      toast.success(t('admin.allProducts.form.saveSuccess'))
      handleCloseEditDrawer()
    } catch (err) {
      console.error('Failed to update product:', err)
      // Error is already set in the store, but show user-friendly message
      toast.error(t('admin.allProducts.errorUpdateProduct'))
      // Keep drawer open on error so user can retry or cancel
    } finally {
      setIsSaving(false)
    }
  }

  // Create drawer handlers
  const handleOpenCreateDrawer = async () => {
    setIsCreateDrawerOpen(true)

    // Fetch brands and categories for the dropdowns
    setIsLoadingBrands(true)
    setIsLoadingCategories(true)

    try {
      const [brands, categories] = await Promise.all([
        productService.getBrands(),
        productService.getCategories(),
      ])
      setAvailableBrands(brands)
      setAvailableCategories(categories)
    } catch (error) {
      console.error('Failed to fetch brands/categories:', error)
      toast.error(t('admin.allProducts.errorLoadBrandsCategories'))
    } finally {
      setIsLoadingBrands(false)
      setIsLoadingCategories(false)
    }
  }

  const handleCloseCreateDrawer = () => {
    // Prevent closing the drawer while a create operation is in progress
    if (isCreating) {
      return
    }
    setIsCreateDrawerOpen(false)
    setCreateFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      brandId: '',
      categoryId: '',
    })
    setCreateFormErrors({})
  }

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for the field being edited
    if (field === 'name' || field === 'description' || field === 'price' || field === 'quantity' || field === 'brandId' || field === 'categoryId') {
      setCreateFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  const validateCreateFormData = (): boolean => {
    const errors: { name?: string; description?: string; price?: string; quantity?: string; brandId?: string; categoryId?: string } = {}

    // Validate name: must be non-empty
    if (!createFormData.name || createFormData.name.trim() === '') {
      errors.name = t('admin.allProducts.form.errorInvalidName')
    }

    // Validate description: must be non-empty
    if (!createFormData.description || createFormData.description.trim() === '') {
      errors.description = t('admin.allProducts.form.errorInvalidDescription')
    }

    // Validate price: must be a valid positive finite number
    const priceValue = parseFloat(createFormData.price)
    if (!Number.isFinite(priceValue) || priceValue <= 0 || createFormData.price.trim() === '') {
      errors.price = t('admin.allProducts.form.errorInvalidPrice')
    }

    // Validate quantity: must be a valid non-negative finite integer
    const quantityValue = Number(createFormData.quantity)
    if (!Number.isFinite(quantityValue) || quantityValue < 0 || createFormData.quantity.trim() === '' || !Number.isInteger(quantityValue)) {
      errors.quantity = t('admin.allProducts.form.errorInvalidStock')
    }

    // Validate brand: must be selected
    if (!createFormData.brandId || createFormData.brandId.trim() === '') {
      errors.brandId = t('admin.allProducts.form.errorInvalidBrand')
    }

    // Validate category: must be selected
    if (!createFormData.categoryId || createFormData.categoryId.trim() === '') {
      errors.categoryId = t('admin.allProducts.form.errorInvalidCategory')
    }

    setCreateFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateProduct = async () => {
    // Validate form data before making API call
    if (!validateCreateFormData()) {
      // Validation errors are already set in state and will be displayed
      return
    }

    setIsCreating(true)
    try {
      // Prepare the create data with all required fields
      const price = parseFloat(createFormData.price)
      const quantity = Number(createFormData.quantity)

      const createData = {
        name: createFormData.name,
        description: createFormData.description,
        price,
        quantity,
        brand: createFormData.brandId,
        category: createFormData.categoryId,
      }

      // TODO: API endpoint implementation will be done later
      // When ready, uncomment the following:
      // await productService.createProduct(createData)
      // toast.success(t('admin.allProducts.form.createSuccess'))
      // handleCloseCreateDrawer()
      // void fetchProducts({ page: 1 })

      // For now, just log the data that would be sent
      console.log('Product data ready to be created:', createData)
      toast.info(t('admin.allProducts.createNotImplemented'))

    } catch (err) {
      console.error('Failed to create product:', err)
      toast.error(t('admin.allProducts.errorCreateProduct'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setProductToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    try {
      // Use store action to delete product (it handles state updates automatically)
      await deleteProductFromStore(productToDelete.id)

      // Get the page after deletion from the store
      const pageAfterDelete = useProductStore.getState().page

      // If in search mode, also remove from search results
      if (isSearchMode) {
        setSearchResults((prev) => prev.filter((p) => p.id !== productToDelete.id))
        setSearchResultsCount((prev) => Math.max(0, prev - 1))
      } else {
        // Always refetch the current page after deletion to ensure the page stays "full"
        // With offset pagination, deleting an item should pull the next item from the
        // subsequent page to fill the gap. Since the store only filters locally,
        // we need to refetch to get the correct data from the backend.
        void fetchProducts({ page: pageAfterDelete })
      }

      // Show success message
      toast.success(t('admin.allProducts.deleteSuccess'))

      // Close dialog
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (err) {
      console.error('Failed to delete product:', err)
      // Error is already set in the store, but show user-friendly message
      toast.error(t('admin.allProducts.errorDeleteProduct'))
      // Keep dialog open on error so user can retry or cancel
    } finally {
      setIsDeleting(false)
    }
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
      // Clear search mode and search results
      if (isSearchMode) {
        setIsSearchMode(false)
        setSearchResults([])
        setSearchResultsCount(0)
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
        setSearchResults(response.products)
        // In search mode, we only show the results we fetched (no pagination)
        // Don't use response.total since we can't paginate through all results
        setSearchResultsCount(response.products.length)
        setIsSearchMode(true)
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
            onClick={handleOpenCreateDrawer}
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
          {getErrorMessage(productsError, t)}
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
                              onClick={() => handleDeleteClick(product)}
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
            <IconButton onClick={handleCloseEditDrawer} disabled={isSaving} sx={{ color: 'white' }}>
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
                    error={!!formErrors.name}
                    helperText={formErrors.name}
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
                    error={!!formErrors.description}
                    helperText={formErrors.description}
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
                    error={!!formErrors.price}
                    helperText={formErrors.price}
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
                    error={!!formErrors.stock}
                    helperText={formErrors.stock}
                  />
                </Grid>

                {/* Category - Read-only field (backend doesn't support category updates) */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.allProducts.form.category')}
                    value={selectedProduct.category.name}
                    disabled
                    helperText={t('admin.allProducts.form.categoryReadOnly')}
                  />
                </Grid>

                {/* Product Info */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('admin.allProducts.form.productId')}: {selectedProduct.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('admin.allProducts.form.rating')}: {selectedProduct.rating.toFixed(1)} ({t('admin.allProducts.form.reviewCount', { count: selectedProduct.reviewCount })})
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
              disabled={isSaving}
            >
              {t('admin.allProducts.form.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveProduct}
              disabled={!selectedProduct || isSaving}
            >
              {isSaving ? t('admin.allProducts.form.saving') : t('admin.allProducts.form.save')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Create Product Drawer */}
      <Drawer
        anchor="right"
        open={isCreateDrawerOpen}
        onClose={handleCloseCreateDrawer}
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
              {t('admin.allProducts.createProduct')}
            </Typography>
            <IconButton onClick={handleCloseCreateDrawer} disabled={isCreating} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            <Grid container spacing={3}>
              {/* Product Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.allProducts.form.productName')}
                  value={createFormData.name}
                  onChange={(e) => handleCreateFormChange('name', e.target.value)}
                  required
                  error={!!createFormErrors.name}
                  helperText={createFormErrors.name}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.allProducts.form.description')}
                  value={createFormData.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
                  multiline
                  rows={4}
                  required
                  error={!!createFormErrors.description}
                  helperText={createFormErrors.description}
                />
              </Grid>

              {/* Price */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('admin.allProducts.form.price')}
                  value={createFormData.price}
                  onChange={(e) => handleCreateFormChange('price', e.target.value)}
                  type="number"
                  required
                  error={!!createFormErrors.price}
                  helperText={createFormErrors.price}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>

              {/* Stock/Quantity */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('admin.allProducts.form.stock')}
                  value={createFormData.quantity}
                  onChange={(e) => handleCreateFormChange('quantity', e.target.value)}
                  type="number"
                  required
                  error={!!createFormErrors.quantity}
                  helperText={createFormErrors.quantity}
                />
              </Grid>

              {/* Brand */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={availableBrands}
                  getOptionLabel={(option) => option.name}
                  value={availableBrands.find((b) => b.id === createFormData.brandId) || null}
                  onChange={(_, value) => handleCreateFormChange('brandId', value?.id || '')}
                  loading={isLoadingBrands}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('admin.allProducts.form.brand')}
                      required
                      error={!!createFormErrors.brandId}
                      helperText={createFormErrors.brandId}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingBrands ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={availableCategories}
                  getOptionLabel={(option) => option.name}
                  value={availableCategories.find((c) => c.id === createFormData.categoryId) || null}
                  onChange={(_, value) => handleCreateFormChange('categoryId', value?.id || '')}
                  loading={isLoadingCategories}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('admin.allProducts.form.category')}
                      required
                      error={!!createFormErrors.categoryId}
                      helperText={createFormErrors.categoryId}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingCategories ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Info Message */}
              <Grid item xs={12}>
                <Alert severity="info">
                  {t('admin.allProducts.form.createInfo')}
                </Alert>
              </Grid>
            </Grid>
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
              onClick={handleCloseCreateDrawer}
              disabled={isCreating}
            >
              {t('admin.allProducts.form.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateProduct}
              disabled={isCreating}
            >
              {isCreating ? t('admin.allProducts.form.creating') : t('admin.allProducts.form.create')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-product-dialog-title"
        aria-describedby="delete-product-dialog-description"
      >
        <DialogTitle id="delete-product-dialog-title">
          {t('admin.allProducts.deleteProduct')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-product-dialog-description">
            {t('admin.allProducts.deleteProductConfirm')} <strong>{productToDelete?.name}</strong>?{' '}
            {t('admin.allProducts.deleteProductWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary" disabled={isDeleting}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
            disabled={isDeleting}
          >
            {isDeleting ? t('admin.allProducts.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AdminAllProductsPage

