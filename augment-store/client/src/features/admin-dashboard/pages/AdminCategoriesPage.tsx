import { useEffect, useRef, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans } from 'react-i18next'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useToast } from '@hooks/useToast'
import { useAuthStore } from '@store/authStore'
import { useCategoryStore } from '@store/categoryStore'
import { storageService } from '@services/api/storage/storageService'
import { categoryNameToSlug } from '@utils/categoryUtils'
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
  const { categories, isLoading, error, getAllCategories, updateCategory, createCategory, deleteCategory } = useCategoryStore()

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

  // Create drawer state
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    parent: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Cleanup blob URL on component unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

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

  // Create drawer handlers
  const handleOpenCreateDrawer = () => {
    setCreateFormData({
      name: '',
      description: '',
      parent: '',
    })
    setSelectedImageFile(null)
    setImagePreviewUrl(null)
    setIsCreateDrawerOpen(true)
  }

  const handleCloseCreateDrawer = () => {
    // Prevent closing while create/upload is in progress
    if (isCreating || isUploadingImage) {
      return
    }

    setIsCreateDrawerOpen(false)
    setCreateFormData({
      name: '',
      description: '',
      parent: '',
    })
    setSelectedImageFile(null)
    // Cleanup preview URL to prevent memory leak
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(null)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error(t('admin.categoriesPage.form.invalidFileType'))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(t('admin.categoriesPage.form.fileSizeExceeded', { size: (file.size / (1024 * 1024)).toFixed(2) }))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Revoke previous preview URL to prevent memory leak
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }

    // Create new preview URL
    const url = URL.createObjectURL(file)
    setImagePreviewUrl(url)
    setSelectedImageFile(file)
  }

  const handleRemoveImage = () => {
    // Revoke preview URL to prevent memory leak
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setImagePreviewUrl(null)
    setSelectedImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreateCategory = async () => {
    setIsCreating(true)

    try {
      let imageFileId: string | null = null

      // Upload image if selected
      if (selectedImageFile) {
        setIsUploadingImage(true)
        try {
          imageFileId = await storageService.uploadAvatar(selectedImageFile)
        } catch (uploadError) {
          console.error('❌ Failed to upload image:', uploadError)

          // Map error messages to translation keys
          let errorMessage = t('admin.categoriesPage.form.uploadFailed')

          if (uploadError instanceof Error) {
            const message = uploadError.message

            // Check for specific error patterns and map to translation keys
            if (message.includes('Invalid file type')) {
              errorMessage = t('admin.categoriesPage.form.invalidFileType')
            } else if (message.includes('File size too large')) {
              // Extract file size from error message if available
              const sizeMatch = message.match(/(\d+(\.\d+)?)\s*MB/)
              const size = sizeMatch ? sizeMatch[1] : '?'
              errorMessage = t('admin.categoriesPage.form.fileSizeExceeded', { size })
            } else if (message.includes('logged in') || message.includes('login')) {
              errorMessage = t('admin.categoriesPage.form.authenticationFailed')
            } else if (message.includes('401')) {
              errorMessage = t('admin.categoriesPage.form.authenticationFailed')
            }
            // For any other errors, use the generic uploadFailed message
          }

          toast.error(errorMessage)
          setIsUploadingImage(false)
          setIsCreating(false)
          return
        } finally {
          setIsUploadingImage(false)
        }
      }

      // Prepare the create data
      // Generate slug from category name (e.g., "Electronics" -> "electronics")
      const slug = categoryNameToSlug(createFormData.name)

      const createData: {
        name: string
        slug: string
        description: string
        parent: string | null
        image?: string | null
      } = {
        name: createFormData.name,
        slug: slug,
        description: createFormData.description,
        parent: createFormData.parent || null,
      }

      // Only include image field if an image was actually uploaded
      // This prevents unnecessary refetch when no image is selected
      if (imageFileId !== null) {
        createData.image = imageFileId
      }

      // Call the store action to create the category
      await createCategory(createData)

      // Show success message via toast
      toast.success(t('admin.categoriesPage.form.createSuccess'))

      // Close drawer and reset form only if drawer is still open
      // This prevents wiping a newly-opened form if user closed and reopened during the request
      if (isCreateDrawerOpen) {
        setIsCreateDrawerOpen(false)
        setCreateFormData({
          name: '',
          description: '',
          parent: '',
        })
        setSelectedImageFile(null)
        // Cleanup preview URL to prevent memory leak
        if (imagePreviewUrl) {
          URL.revokeObjectURL(imagePreviewUrl)
        }
        setImagePreviewUrl(null)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (err) {
      console.error('❌ Failed to create category:', err)

      // Check if it's a 401 error
      if (err instanceof Error && err.message.includes('401')) {
        toast.error(t('admin.categoriesPage.form.authenticationFailed'))
      } else {
        toast.error(t('admin.categoriesPage.errorCreateCategory'))
      }

      // Keep drawer open on error so user can retry or cancel
    } finally {
      setIsCreating(false)
    }
  }

  // Delete handlers
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCancel = () => {
    // Prevent closing the dialog while delete is in progress
    if (isDeleting) return

    setDeleteDialogOpen(false)
    setCategoryToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    setIsDeleting(true)

    try {
      // Call the store action to delete the category
      await deleteCategory(categoryToDelete.id)

      // Show success message
      toast.success(t('admin.categoriesPage.deleteSuccess'))

      // Close dialog
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (err) {
      console.error('Failed to delete category:', err)
      toast.error(t('admin.categoriesPage.errorDeleteCategory'))
      // Keep dialog open on error so user can retry or cancel
    } finally {
      setIsDeleting(false)
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDrawer}
          >
            {t('admin.categoriesPage.createCategory')}
          </Button>
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
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          onClick={() => handleDeleteClick(category)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
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

      {/* Create Category Drawer */}
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
              {t('admin.categoriesPage.newCategory')}
            </Typography>
            <IconButton onClick={handleCloseCreateDrawer} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            <Grid container spacing={3}>
              {/* Category Image Upload */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {/* Image Preview */}
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={imagePreviewUrl || undefined}
                      variant="rounded"
                      sx={{ width: 120, height: 120, bgcolor: 'grey.200' }}
                    >
                      {!imagePreviewUrl && <CategoryIcon sx={{ fontSize: 60, color: 'grey.400' }} />}
                    </Avatar>

                    {/* Upload Button */}
                    {!isUploadingImage && (
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          boxShadow: 2,
                        }}
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Upload category image"
                        disabled={isCreating}
                      >
                        <PhotoCameraIcon fontSize="small" />
                      </IconButton>
                    )}

                    {/* Remove Button */}
                    {!isUploadingImage && imagePreviewUrl && (
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'error.dark',
                          },
                          boxShadow: 2,
                        }}
                        size="small"
                        onClick={handleRemoveImage}
                        aria-label="Remove category image"
                        disabled={isCreating}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}

                    {/* Loading Spinner */}
                    {isUploadingImage && (
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
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: 1,
                        }}
                      >
                        <CircularProgress size={40} sx={{ color: 'white' }} />
                      </Box>
                    )}
                  </Box>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                    disabled={isCreating || isUploadingImage}
                    aria-label="Category image file input"
                  />

                  {/* Upload Instructions */}
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    {t('admin.categoriesPage.form.uploadInstructions')}
                    <br />
                    {t('admin.categoriesPage.form.uploadFormats')}
                  </Typography>
                </Box>
              </Grid>

              {/* Category Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.categoriesPage.form.categoryName')}
                  value={createFormData.name}
                  onChange={(e) => handleCreateFormChange('name', e.target.value)}
                  required
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.categoriesPage.form.description')}
                  value={createFormData.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
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
                  value={createFormData.parent}
                  onChange={(e) => handleCreateFormChange('parent', e.target.value)}
                >
                  <MenuItem value="">
                    {t('admin.categoriesPage.form.noParent')}
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          {/* Footer Actions */}
          <Divider />
          <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCloseCreateDrawer}
              disabled={isCreating}
            >
              {t('admin.categoriesPage.form.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateCategory}
              disabled={isCreating || !createFormData.name.trim()}
            >
              {isCreating ? t('admin.categoriesPage.form.creating') : t('admin.categoriesPage.form.create')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-category-dialog-title"
        aria-describedby="delete-category-dialog-description"
      >
        <DialogTitle id="delete-category-dialog-title">
          {t('admin.categoriesPage.deleteCategory')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-category-dialog-description">
            <Trans
              i18nKey="admin.categoriesPage.deleteCategoryConfirm"
              values={{ categoryName: categoryToDelete?.name }}
              components={{ strong: <strong /> }}
            />
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
            {isDeleting ? t('admin.categoriesPage.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AdminCategoriesPage

