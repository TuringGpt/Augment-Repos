import { useEffect, useRef, useMemo, useState } from 'react'
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
  Drawer,
  Divider,
  Grid,
  TextField,
  MenuItem,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useToast } from '@hooks/useToast'
import { useAuthStore } from '@store/authStore'
import { useCategoryStore } from '@store/categoryStore'
import type { Category } from '@features/products/types'

/**
 * AdminCategoriesPage Component
 * Admin page for viewing and managing categories
 */
const AdminCategoriesPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toast = useToast()
  const { user, isAuthenticated } = useAuthStore()

  // Use category store
  const { categories, isLoading, error, getAllCategories, updateCategory } = useCategoryStore()

  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    parent: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Load categories
  const loadCategories = async () => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    // Fetch categories using the store
    await getAllCategories(abortControllerRef.current.signal)
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

  // Create a lookup map for parent category names
  // This allows us to display parent category names instead of UUIDs
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((category) => {
      map.set(category.id, category.name)
    })
    return map
  }, [categories])

  // Helper function to get parent category name
  const getParentCategoryName = (parentId: string | null | undefined): string => {
    if (!parentId) return '-'
    return categoryMap.get(parentId) || parentId // Fallback to ID if name not found
  }

  // Edit drawer handlers
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setEditFormData({
      name: category.name,
      description: category.description || '',
      parent: category.parent || '',
    })
    setIsEditDrawerOpen(true)
  }

  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false)
    setSelectedCategory(null)
    setEditFormData({
      name: '',
      description: '',
      parent: '',
    })
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveCategory = async () => {
    if (!selectedCategory) return

    setIsSaving(true)

    try {
      // Prepare the update data
      const updateData = {
        name: editFormData.name,
        description: editFormData.description,
        parent: editFormData.parent || null,
      }

      // Call the store action to update the category
      await updateCategory(selectedCategory.id, updateData)

      // Show success message via toast
      toast.success(t('admin.categoriesPage.form.saveSuccess'))
      handleCloseEditDrawer()
    } catch (err) {
      console.error('Failed to update category:', err)
      toast.error(t('admin.categoriesPage.errorUpdateCategory'))
      // Keep drawer open on error so user can retry or cancel
    } finally {
      setIsSaving(false)
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
        <Alert severity="error" sx={{ mb: 3 }}>
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
                  <TableCell align="center">{t('admin.categoriesPage.table.actions')}</TableCell>
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
                        {getParentCategoryName(category.parent)}
                      </Typography>
                    </TableCell>

                    {/* ID */}
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {category.id}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Tooltip title={t('common.edit')}>
                        <IconButton
                          onClick={() => handleEditCategory(category)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
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

      {/* Edit Category Drawer */}
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
              {t('admin.categoriesPage.editCategory')}
            </Typography>
            <IconButton onClick={handleCloseEditDrawer} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {selectedCategory && (
              <Grid container spacing={3}>
                {/* Category Image Preview */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Avatar
                      src={selectedCategory.image}
                      alt={selectedCategory.name}
                      variant="rounded"
                      sx={{ width: 120, height: 120 }}
                    >
                      {!selectedCategory.image && <CategoryIcon sx={{ fontSize: 60 }} />}
                    </Avatar>
                  </Box>
                </Grid>

                {/* Category Name */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.categoriesPage.form.categoryName')}
                    value={editFormData.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    required
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.categoriesPage.form.description')}
                    value={editFormData.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    multiline
                    rows={4}
                  />
                </Grid>

                {/* Parent Category */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label={t('admin.categoriesPage.form.parentCategory')}
                    value={editFormData.parent}
                    onChange={(e) => handleEditFormChange('parent', e.target.value)}
                  >
                    <MenuItem value="">
                      {t('admin.categoriesPage.form.noParent')}
                    </MenuItem>
                    {categories
                      .filter((cat) => cat.id !== selectedCategory.id)
                      .map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>

                {/* Category ID (Read-only) */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.categoriesPage.table.id')}
                    value={selectedCategory.id}
                    disabled
                    InputProps={{
                      sx: { fontFamily: 'monospace' },
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>

          {/* Footer Actions */}
          <Divider />
          <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCloseEditDrawer}
              disabled={isSaving}
            >
              {t('admin.categoriesPage.form.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveCategory}
              disabled={isSaving || !editFormData.name.trim()}
            >
              {isSaving ? t('admin.categoriesPage.form.saving') : t('admin.categoriesPage.form.save')}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  )
}

export default AdminCategoriesPage

