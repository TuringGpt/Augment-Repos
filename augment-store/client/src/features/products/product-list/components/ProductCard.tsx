import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Rating,
  Chip,
  CardActionArea,
  Fade,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import type { Product } from '@features/products/types'
import AddToWishlistButton from '@features/user/wishlist/components/AddToWishlistButton'
import { useTranslation } from '@hooks/useTranslation'

interface ProductCardProps {
  product: Product
  index?: number
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleClick = () => {
    navigate(`/products/${product.id}`)
  }

  const displayPrice = product.discountPrice || product.price
  const hasDiscount = !!product.discountPrice

  return (
    <Fade in={true} timeout={300 + index * 50} style={{ transitionDelay: `${index * 30}ms` }}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        {/* Wishlist Button - Top Left */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 2,
            bgcolor: 'background.paper',
            borderRadius: '50%',
            boxShadow: 1,
          }}
        >
          <AddToWishlistButton productId={product.id} size="small" />
        </Box>

        <CardActionArea
          onClick={handleClick}
          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          {/* Discount Badge */}
          {hasDiscount && (
            <Chip
              label={`-${Math.round(((product.price - product.discountPrice!) / product.price) * 100)}%`}
              color="error"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                fontWeight: 'bold',
              }}
            />
          )}

          {/* Stock Badge */}
          {product.stock === 0 && (
            <Chip
              label={t('product.outOfStock')}
              color="default"
              size="small"
              sx={{
                position: 'absolute',
                top: 48,
                left: 8,
                zIndex: 1,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
              }}
            />
          )}

          {/* Product Image */}
          <CardMedia
            component="img"
            height="280"
            image={product.images[0]}
            alt={product.name}
            sx={{
              objectFit: 'contain',
              opacity: product.stock === 0 ? 0.5 : 1,
              bgcolor: 'background.default',
            }}
          />

          {/* Product Details */}
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Category */}
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {product.category.name}
            </Typography>

            {/* Product Name */}
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                minHeight: '3em',
                mb: 0.5,
              }}
            >
              {product.name}
            </Typography>

            {/* Rating */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={product.rating / 2} readOnly precision={0.1} size="small" max={5} />
              <Typography variant="caption" color="text.secondary">
                ({product.rating.toFixed(1)})
              </Typography>
            </Box>

            {/* Price */}
            <Box sx={{ mt: 'auto' }}>
              {hasDiscount ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    ${product.price.toFixed(2)}
                  </Typography>
                  <Typography variant="h6" color="error" sx={{ fontWeight: 'bold' }}>
                    ${displayPrice.toFixed(2)}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  ${displayPrice.toFixed(2)}
                </Typography>
              )}
            </Box>

            {/* Stock Info */}
            {product.stock > 0 && product.stock < 20 && (
              <Typography variant="caption" sx={{ mt: 0.5, color: 'warning.main' }}>
                {t('product.lowStock', { count: product.stock })}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    </Fade>
  )
}

export default ProductCard
