import { useEffect, useRef, useState } from 'react'
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
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Storefront as BrandIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Save as SaveIcon,
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
  const { brands, isLoading, error, fetchBrands, updateBrand } = useBrandStore()

  // Track current abort controller for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false)

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

  // Edit drawer handlers
  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setEditFormData({
      name: brand.name,
      description: brand.description || '',
    })
    setSelectedImage(null)
    setShouldRemoveImage(false)
    setImageUploadError(null)
    setIsEditDrawerOpen(true)
  }

  const handleCloseEditDrawer = () => {
    // Prevent closing while save is in progress
    if (isSaving) {
      return
    }

    setIsEditDrawerOpen(false)
    setSelectedBrand(null)
    setEditFormData({
      name: '',
      description: '',
    })
    setSelectedImage(null)
    setShouldRemoveImage(false)
    setImageUploadError(null)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    setShouldRemoveImage(false)
    setImageUploadError(null)
  }

  const handleImageRemove = () => {
    setSelectedImage(null)
    setShouldRemoveImage(true)
    setImageUploadError(null)
  }

  const handleImageValidationError = (error: string) => {
    // Clear selectedImage to prevent uploading a previously-selected file
    setSelectedImage(null)
    setShouldRemoveImage(false)
    // Surface the validation error message
    setImageUploadError(error)
  }

  const handleSaveBrand = async () => {
    if (!selectedBrand) return

    setIsSaving(true)
    setImageUploadError(null)

    try {
      let imageFileId: string | null = null

      // Handle image upload if a new image was selected
      if (selectedImage) {
        try {
          setIsUploadingImage(true)

          // Upload file and get file ID
          imageFileId = await storageService.uploadFile(selectedImage)
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError)
          setImageUploadError(t('admin.brandsPage.errorUploadImage'))
          setIsUploadingImage(false)
          setIsSaving(false)
          return
        } finally {
          setIsUploadingImage(false)
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
      } else if (shouldRemoveImage) {
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
      setSelectedImage(null)
      setShouldRemoveImage(false)
      setImageUploadError(null)
      setIsSaving(false)
    } catch (err) {
      console.error('Failed to update brand:', err)
      toast.error(t('admin.brandsPage.errorUpdateBrand'))
      setIsSaving(false)
      // Keep drawer open on error so user can retry or cancel
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
                        {brand.id.slice(0, 8)}...
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Tooltip title={t('common.edit')}>
                        <IconButton
                          onClick={() => handleEditBrand(brand)}
                          color="primary"
                          size="small"
                          disabled={isSaving}
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
              disabled={isSaving}
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
                      currentImage={shouldRemoveImage ? null : selectedBrand.image || null}
                      userName={selectedBrand.name}
                      onImageSelect={handleImageSelect}
                      onImageRemove={handleImageRemove}
                      onValidationError={handleImageValidationError}
                      isUploading={isUploadingImage}
                      disabled={isSaving}
                      error={imageUploadError}
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
              disabled={isSaving}
            >
              {t('admin.brandsPage.form.cancel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveBrand}
              disabled={isSaving || !editFormData.name.trim() || isUploadingImage}
            >
              {isSaving ? t('admin.brandsPage.form.saving') : t('admin.brandsPage.form.save')}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  )
}

export default AdminBrandsPage

