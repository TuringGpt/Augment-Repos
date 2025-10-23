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
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material'
import { useCartStore } from '@store/cartStore'
import { mockProductService } from '@services/api/products/mockProductService'
import type { Product } from '@features/products/types'
import { mockReviews } from '@data/mockReviews'
import ImageGallery from './ImageGallery'
import ReviewSection from './ReviewSection'

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  const { cart, addItem, removeItem, isInCart, getCartItem } = useCartStore()
  const productInCart = id ? isInCart(id) : false
  const cartItem = id ? getCartItem(id) : undefined

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)
        const data = await mockProductService.getProductById(id)

        // Add reviews to product
        const productWithReviews = {
          ...data,
          reviews: mockReviews[id] || [],
        }

        setProduct(productWithReviews)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(product?.stock || 1, prev + delta)))
  }

  const handleAddToCart = () => {
    if (!product || !cart) return

    const cartItem = {
      id: `cart-${product.id}-${Date.now()}`,
      product,
      quantity,
      price: product.discountPrice || product.price,
      subtotal: (product.discountPrice || product.price) * quantity,
    }

    addItem(cartItem)
  }

  const handleRemoveFromCart = () => {
    if (!cartItem) return
    removeItem(cartItem.id)
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

  const displayPrice = product.discountPrice || product.price
  const hasDiscount = !!product.discountPrice
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')} sx={{ mb: 3 }}>
        Back to Products
      </Button>

      <Grid container spacing={4}>
        {/* Image Gallery */}
        <Grid item xs={12} md={6}>
          <ImageGallery images={product.images} productName={product.name} />
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
              <Rating value={product.rating} precision={0.1} readOnly />
              <Typography variant="body2" color="text.secondary">
                {product.rating} ({product.reviewCount} reviews)
              </Typography>
            </Box>

            {/* Price */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ${displayPrice.toFixed(2)}
                </Typography>
                {hasDiscount && (
                  <>
                    <Typography
                      variant="h5"
                      sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                    >
                      ${product.price.toFixed(2)}
                    </Typography>
                    <Chip
                      label={`${discountPercentage}% OFF`}
                      color="error"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </>
                )}
              </Box>
            </Box>

            {/* Stock Status */}
            <Box sx={{ mb: 3 }}>
              {product.stock > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={product.stock > 20 ? 'In Stock' : `Only ${product.stock} left`}
                    color={product.stock > 20 ? 'success' : 'warning'}
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
            {product.stock > 0 && (
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
                      disabled={quantity >= product.stock}
                      size="small"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {product.stock} available
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CartIcon />}
                    onClick={handleAddToCart}
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
                    {productInCart ? 'Update Cart' : 'Add to Cart'}
                  </Button>
                  {productInCart && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      onClick={handleRemoveFromCart}
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

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Specifications
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <Box
                      key={key}
                      sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {key}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Reviews Section */}
      <Box sx={{ mt: 6 }}>
        <ReviewSection reviews={product.reviews || []} rating={product.rating} />
      </Box>
    </Container>
  )
}

export default ProductDetailPage
