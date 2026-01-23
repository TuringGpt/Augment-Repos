import { useEffect, useRef, useState } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Storefront as BrandIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useBrandStore } from '@store/brandStore'
import { useToast } from '@hooks/useToast'
import type { Brand } from '@features/products/types'
import { AvatarUpload } from '@features/user/profile/components/AvatarUpload'
import { storageService } from '@services/api/storage/storageService'

/**
 * AdminBrandsPage Component
 * Admin page for viewing and managing brands
 */
const AdminBrandsPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toast = useToast()
  const { user, isAuthenticated } = useAuthStore()

  // Use brand store
  const { brands, isLoading, error, fetchBrands, updateBrand, createBrand, deleteBrand } = useBrandStore()

  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Create drawer state
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
  })
  const [isCreating, setIsCreating] = useState(false)

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Edit drawer image state
  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null)
  const [editIsUploadingImage, setEditIsUploadingImage] = useState(false)
  const [editImageUploadError, setEditImageUploadError] = useState<string | null>(null)
  const [editShouldRemoveImage, setEditShouldRemoveImage] = useState(false)

  // Create drawer image state
  const [createSelectedImage, setCreateSelectedImage] = useState<File | null>(null)
  const [createIsUploadingImage, setCreateIsUploadingImage] = useState(false)
  const [createImageUploadError, setCreateImageUploadError] = useState<string | null>(null)
  const [createShouldRemoveImage, setCreateShouldRemoveImage] = useState(false)

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

  // Create drawer handlers
  const handleOpenCreateDrawer = () => {
    // Close edit drawer if open to ensure only one drawer is active at a time
    // Block opening create drawer if edit drawer can't be closed (saving/uploading in progress)
    if (isEditDrawerOpen) {
      if (isSaving || editIsUploadingImage) {
        // Can't close edit drawer while saving/uploading, so don't open create drawer
        return
      }
      handleCloseEditDrawer()
    }

    setCreateFormData({
      name: '',
      description: '',
    })
    setCreateSelectedImage(null)
    setCreateShouldRemoveImage(false)
    setCreateImageUploadError(null)
    setIsCreateDrawerOpen(true)
  }

  const handleCloseCreateDrawer = () => {
    // Prevent closing while create is in progress
    if (isCreating || createIsUploadingImage) {
      return
    }

    setIsCreateDrawerOpen(false)
    setCreateFormData({
      name: '',
      description: '',
    })
    setCreateSelectedImage(null)
    setCreateShouldRemoveImage(false)
    setCreateImageUploadError(null)
  }

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCreateBrand = async () => {
    setIsCreating(true)
    setCreateImageUploadError(null)

    // Track uploaded file ID for cleanup if brand creation fails
    let uploadedFileId: string | null = null

    try {
      let imageFileId: string | null = null

      // Handle image upload if a new image was selected
      if (createSelectedImage) {
        try {
          setCreateIsUploadingImage(true)

          // Upload file and get file ID
          // NOTE: The image is uploaded before createBrand() is called.
          // If brand creation fails (e.g., duplicate name), the uploaded file
          // can become orphaned. Ideally, we should either:
          // 1. Upload the image AFTER successful brand creation (requires backend changes)
          // 2. Implement a cleanup mechanism to delete orphaned files (requires DELETE endpoint)
          // 3. Have the backend handle cleanup of unused files automatically
          // For now, we track the file ID and log it for manual cleanup if needed.
          imageFileId = await storageService.uploadFile(createSelectedImage)
          uploadedFileId = imageFileId
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError)
          setCreateImageUploadError(t('admin.brandsPage.errorUploadImage'))
          setCreateIsUploadingImage(false)
          setIsCreating(false)
          return
        } finally {
          setCreateIsUploadingImage(false)
        }
      }

      // Prepare create data
      const createData: { name: string; description?: string; image?: string | null } = {
        name: createFormData.name.trim(),
        description: createFormData.description.trim(),
      }

      // Add image field if needed
      if (imageFileId) {
        createData.image = imageFileId
      }

      // Create brand
      await createBrand(createData)

      // Show success message via toast
      toast.success(t('admin.brandsPage.form.createSuccess'))

      // Close drawer and reset state
      setIsCreateDrawerOpen(false)
      setCreateFormData({
        name: '',
        description: '',
      })
      setCreateSelectedImage(null)
      setCreateShouldRemoveImage(false)
      setCreateImageUploadError(null)
      setIsCreating(false)
    } catch (err) {
      console.error('Failed to create brand:', err)

      // If we uploaded a file but brand creation failed, log the orphaned file ID
      if (uploadedFileId) {
        console.warn(
          `Brand creation failed after image upload. Orphaned file ID: ${uploadedFileId}. ` +
          'This file may need manual cleanup or will be handled by backend garbage collection.'
        )
      }

      toast.error(t('admin.brandsPage.errorCreateBrand'))
      setIsCreating(false)
      // Keep drawer open on error so user can retry or cancel
    }
  }

  // Edit drawer handlers
  const handleEditBrand = (brand: Brand) => {
    // Close create drawer if open to ensure only one drawer is active at a time
    // Block opening edit drawer if create drawer can't be closed (creating/uploading in progress)
    if (isCreateDrawerOpen) {
      if (isCreating || createIsUploadingImage) {
        // Can't close create drawer while creating/uploading, so don't open edit drawer
        return
      }
      handleCloseCreateDrawer()
    }

    setSelectedBrand(brand)
    setEditFormData({
      name: brand.name,
      description: brand.description || '',
    })
    setEditSelectedImage(null)
    setEditShouldRemoveImage(false)
    setEditImageUploadError(null)
    setIsEditDrawerOpen(true)
  }

  const handleCloseEditDrawer = () => {
    // Prevent closing while save is in progress
    if (isSaving || editIsUploadingImage) {
      return
    }

    setIsEditDrawerOpen(false)
    setSelectedBrand(null)
    setEditFormData({
      name: '',
      description: '',
    })
    setEditSelectedImage(null)
    setEditShouldRemoveImage(false)
    setEditImageUploadError(null)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Edit drawer image handlers
  const handleEditImageSelect = (file: File) => {
    setEditSelectedImage(file)
    setEditShouldRemoveImage(false)
    setEditImageUploadError(null)
  }

  const handleEditImageRemove = () => {
    setEditSelectedImage(null)
    setEditShouldRemoveImage(true)
    setEditImageUploadError(null)
  }

  const handleEditImageValidationError = (error: string) => {
    // Clear selectedImage to prevent uploading a previously-selected file
    setEditSelectedImage(null)
    setEditShouldRemoveImage(false)
    // Surface the validation error message
    setEditImageUploadError(error)
  }

  // Create drawer image handlers
  const handleCreateImageSelect = (file: File) => {
    setCreateSelectedImage(file)
    setCreateShouldRemoveImage(false)
    setCreateImageUploadError(null)
  }

  const handleCreateImageRemove = () => {
    setCreateSelectedImage(null)
    setCreateShouldRemoveImage(true)
    setCreateImageUploadError(null)
  }

  const handleCreateImageValidationError = (error: string) => {
    // Clear selectedImage to prevent uploading a previously-selected file
    setCreateSelectedImage(null)
    setCreateShouldRemoveImage(false)
    // Surface the validation error message
    setCreateImageUploadError(error)
  }

  const handleSaveBrand = async () => {
    if (!selectedBrand) return

    setIsSaving(true)
    setEditImageUploadError(null)

    // Track uploaded file ID for cleanup if brand update fails
    let uploadedFileId: string | null = null

    try {
      let imageFileId: string | null = null

      // Handle image upload if a new image was selected
      if (editSelectedImage) {
        try {
          setEditIsUploadingImage(true)

          // Upload file and get file ID
          // NOTE: The image is uploaded before updateBrand() is called.
          // If brand update fails, the uploaded file can become orphaned.
          // See handleCreateBrand for more details on this limitation.
          imageFileId = await storageService.uploadFile(editSelectedImage)
          uploadedFileId = imageFileId
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError)
          setEditImageUploadError(t('admin.brandsPage.errorUploadImage'))
          setEditIsUploadingImage(false)
          setIsSaving(false)
          return
        } finally {
          setEditIsUploadingImage(false)
        }
      }

      // Prepare update data
      const updateData: { name?: string; description?: string; image?: string | null } = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
      }

      // Add image field if needed
      if (imageFileId) {
        updateData.image = imageFileId
      } else if (editShouldRemoveImage) {
        updateData.image = null
      }

      // Update brand
      await updateBrand(selectedBrand.id, updateData)

      // Show success message via toast
      toast.success(t('admin.brandsPage.form.saveSuccess'))

      // Close drawer and reset state
      // Note: We close the drawer directly here instead of calling handleCloseEditDrawer()
      // because setIsSaving(false) won't update synchronously, which would cause the
      // isSaving guard in handleCloseEditDrawer to block the close
      setIsEditDrawerOpen(false)
      setSelectedBrand(null)
      setEditFormData({
        name: '',
        description: '',
      })
      setEditSelectedImage(null)
      setEditShouldRemoveImage(false)
      setEditImageUploadError(null)
      setIsSaving(false)
    } catch (err) {
      console.error('Failed to update brand:', err)

      // If we uploaded a file but brand update failed, log the orphaned file ID
      if (uploadedFileId) {
        console.warn(
          `Brand update failed after image upload. Orphaned file ID: ${uploadedFileId}. ` +
          'This file may need manual cleanup or will be handled by backend garbage collection.'
        )
      }

      toast.error(t('admin.brandsPage.errorUpdateBrand'))
      setIsSaving(false)
      // Keep drawer open on error so user can retry or cancel
    }
  }

  // Delete handlers
  const handleDeleteClick = (brand: Brand) => {
    setBrandToDelete(brand)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCancel = () => {
    // Prevent closing dialog during deletion
    if (isDeleting) return

    setDeleteDialogOpen(false)
    setBrandToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!brandToDelete) return

    setIsDeleting(true)

    try {
      // Call the store action to delete the brand
      await deleteBrand(brandToDelete.id)

      // Show success message
      toast.success(t('admin.brandsPage.deleteSuccess'))

      // Close dialog
      setDeleteDialogOpen(false)
      setBrandToDelete(null)
    } catch (err) {
      console.error('Failed to delete brand:', err)
      toast.error(t('admin.brandsPage.errorDeleteBrand'))
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
            {t('admin.brandsPage.title')}
          </Typography>
          <Typography color="text.secondary">
            {t('admin.brandsPage.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDrawer}
            disabled={isLoading}
          >
            {t('admin.brandsPage.addBrand')}
          </Button>
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
                  <TableCell align="center">{t('admin.brandsPage.table.actions')}</TableCell>
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
                        {brand.id ? `${brand.id.slice(0, 8)}...` : 'N/A'}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Tooltip title={t('common.edit')}>
                        <IconButton
                          onClick={() => handleEditBrand(brand)}
                          color="primary"
                          size="small"
                          disabled={isSaving || isDeleting}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          onClick={() => handleDeleteClick(brand)}
                          color="error"
                          size="small"
                          disabled={isSaving || isDeleting}
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
            {t('admin.brandsPage.noBrands')}
          </Typography>
        </Paper>
      )}

      {/* Edit Brand Drawer */}
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
              {t('admin.brandsPage.editBrand')}
            </Typography>
            <IconButton
              onClick={handleCloseEditDrawer}
              disabled={isSaving || editIsUploadingImage}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {selectedBrand && (
              <Grid container spacing={3}>
                {/* Brand Image Upload */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <AvatarUpload
                      currentImage={editShouldRemoveImage ? null : selectedBrand.image || null}
                      userName={selectedBrand.name}
                      onImageSelect={handleEditImageSelect}
                      onImageRemove={handleEditImageRemove}
                      onValidationError={handleEditImageValidationError}
                      isUploading={editIsUploadingImage}
                      disabled={isSaving}
                      error={editImageUploadError}
                    />
                  </Box>
                </Grid>

                {/* Brand Name */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.brandsPage.form.brandName')}
                    value={editFormData.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    required
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.brandsPage.form.description')}
                    value={editFormData.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    multiline
                    rows={4}
                  />
                </Grid>

                {/* Brand ID (Read-only) */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('admin.brandsPage.table.id')}
                    value={selectedBrand.id}
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
              disabled={isSaving || editIsUploadingImage}
            >
              {t('admin.brandsPage.form.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveBrand}
              disabled={isSaving || !editFormData.name.trim() || editIsUploadingImage}
            >
              {isSaving ? t('admin.brandsPage.form.saving') : t('admin.brandsPage.form.save')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Create Brand Drawer */}
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
              {t('admin.brandsPage.createBrand')}
            </Typography>
            <IconButton
              onClick={handleCloseCreateDrawer}
              disabled={isCreating || createIsUploadingImage}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            <Grid container spacing={3}>
              {/* Brand Image Upload */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <AvatarUpload
                    currentImage={null}
                    userName={createFormData.name || t('admin.brandsPage.form.newBrandPlaceholder')}
                    onImageSelect={handleCreateImageSelect}
                    onImageRemove={handleCreateImageRemove}
                    onValidationError={handleCreateImageValidationError}
                    isUploading={createIsUploadingImage}
                    disabled={isCreating}
                    error={createImageUploadError}
                  />
                </Box>
              </Grid>

              {/* Brand Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.brandsPage.form.brandName')}
                  value={createFormData.name}
                  onChange={(e) => handleCreateFormChange('name', e.target.value)}
                  required
                  disabled={isCreating}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('admin.brandsPage.form.description')}
                  value={createFormData.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
                  multiline
                  rows={4}
                  disabled={isCreating}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Footer Actions */}
          <Divider />
          <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCloseCreateDrawer}
              disabled={isCreating || createIsUploadingImage}
            >
              {t('admin.brandsPage.form.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateBrand}
              disabled={isCreating || !createFormData.name.trim() || createIsUploadingImage}
            >
              {isCreating ? t('admin.brandsPage.form.creating') : t('admin.brandsPage.form.create')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-brand-dialog-title"
        aria-describedby="delete-brand-dialog-description"
      >
        <DialogTitle id="delete-brand-dialog-title">
          {t('admin.brandsPage.deleteBrand')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-brand-dialog-description">
            <Trans
              i18nKey="admin.brandsPage.deleteBrandConfirm"
              values={{ brandName: brandToDelete?.name }}
              components={{ strong: <strong /> }}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary" disabled={isDeleting} autoFocus>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? t('admin.brandsPage.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AdminBrandsPage

