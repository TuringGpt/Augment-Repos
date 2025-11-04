import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Rating,
  Chip,
  Divider,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material'
import { useCartStore } from '@store/cartStore'
import { productService } from '@services/api/products/productService'
import type { ProductDetailAPI } from '@features/products/types/api'
import { PLACEHOLDER_IMAGE } from '@features/products/types/api'
import ImageGallery from './ImageGallery'
import ReviewSection from './ReviewSection'

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductDetailAPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const { addItemToCart, removeItem, isInCart, getCartItem } = useCartStore()
  const productInCart = id ? isInCart(id) : false
  const cartItem = id ? getCartItem(id) : undefined

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)
        const data = await productService.getProductById(id)
        setProduct(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // Sync quantity with cart item when product is in cart
  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity)
    } else {
      setQuantity(1)
    }
  }, [cartItem])

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(product?.quantity || 1, prev + delta)))
  }

  const handleAddToCart = async () => {
    if (!product || !id) return

    try {
      setAddingToCart(true)
      // Call API to add item to cart
      await addItemToCart(id, quantity)
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      // Error is already handled in the store
    } finally {
      setAddingToCart(false)
    }
  }

  const handleRemoveClick = () => {
    setRemoveDialogOpen(true)
  }

  const handleRemoveConfirm = () => {
    if (!cartItem) return
    removeItem(cartItem.id)
    setRemoveDialogOpen(false)
  }

  const handleRemoveCancel = () => {
    setRemoveDialogOpen(false)
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error || !product) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '60vh',
          }}
        >
          {/* Illustration/Icon */}
          <Box
            sx={{
              width: { xs: 150, sm: 200, md: 250 },
              height: { xs: 150, sm: 200, md: 250 },
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Empty Box Illustration */}
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                opacity: 0.1,
                position: 'absolute',
              }}
            />
            <Box
              sx={{
                fontSize: { xs: 80, sm: 100, md: 120 },
                color: 'text.disabled',
                zIndex: 1,
              }}
            >
              📦
            </Box>
          </Box>

          {/* Error Message */}
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            Product Not Found
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            paragraph
            sx={{
              mb: 4,
              maxWidth: 500,
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            Uh-oh! Looks like the product you are looking for isn't available right now.
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="medium"
              onClick={() => navigate('/products')}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
              }}
            >
              Browse All Products
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
              }}
            >
              Go Back
            </Button>
          </Box>
        </Box>
      </Container>
    )
  }

  // Extract image URLs from FileAPI objects, use placeholder if no images
  const imageUrls = product.images
    .map((img) => img.file)
    .filter((url): url is string => url !== null)

  // Use placeholder image if no images available
  const displayImages = imageUrls.length > 0 ? imageUrls : [PLACEHOLDER_IMAGE]

  const priceNumber = parseFloat(product.price)
  const ratingNumber = parseFloat(product.rating)

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')} sx={{ mb: 3 }}>
        Back to Products
      </Button>

      <Grid container spacing={4}>
        {/* Image Gallery */}
        <Grid item xs={12} md={6}>
          <ImageGallery images={displayImages} productName={product.name} />
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Box>
            {/* Category */}
            <Chip label={product.category.name} size="small" sx={{ mb: 2 }} />

            {/* Product Name */}
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {product.name}
            </Typography>

            {/* Rating */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Rating value={ratingNumber} precision={0.1} readOnly />
              <Typography variant="body2" color="text.secondary">
                {ratingNumber.toFixed(1)} (0 reviews)
              </Typography>
            </Box>

            {/* Price */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ${priceNumber.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Stock Status */}
            <Box sx={{ mb: 3 }}>
              {product.quantity > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={product.quantity > 20 ? 'In Stock' : `Only ${product.quantity} left`}
                    color={product.quantity > 20 ? 'success' : 'warning'}
                    size="small"
                  />
                  <ShippingIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Free shipping on orders over $50
                  </Typography>
                </Box>
              ) : (
                <Chip label="Out of Stock" color="error" />
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Description */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Description
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Quantity Selector & Add to Cart */}
            {product.quantity > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Quantity
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <IconButton
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      size="small"
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography
                      sx={{
                        px: 3,
                        py: 1,
                        minWidth: 60,
                        textAlign: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {quantity}
                    </Typography>
                    <IconButton
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.quantity}
                      size="small"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {product.quantity} available
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={
                      addingToCart ? <CircularProgress size={20} color="inherit" /> : <CartIcon />
                    }
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '1rem',
                      minWidth: 200,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      '&:hover': {
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {addingToCart ? 'Adding...' : productInCart ? 'Update Cart' : 'Add to Cart'}
                  </Button>
                  {productInCart && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      onClick={handleRemoveClick}
                      disabled={addingToCart}
                      sx={{
                        py: 1.5,
                        px: 3,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Reviews Section */}
      <Box sx={{ mt: 6 }}>
        <ReviewSection reviews={[]} rating={ratingNumber} />
      </Box>

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={handleRemoveCancel}
        aria-labelledby="remove-dialog-title"
        aria-describedby="remove-dialog-description"
      >
        <DialogTitle id="remove-dialog-title">Remove from Cart?</DialogTitle>
        <DialogContent>
          <DialogContentText id="remove-dialog-description">
            Are you sure you want to remove this product from your cart?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRemoveConfirm} color="error" variant="contained" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default ProductDetailPage
