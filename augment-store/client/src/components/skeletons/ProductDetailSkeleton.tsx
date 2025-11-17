import { Container, Grid, Box, Skeleton, Paper, Divider } from '@mui/material'

interface ProductDetailSkeletonProps {
  /**
   * Whether to animate the skeleton
   * @default "wave"
   */
  animation?: 'pulse' | 'wave' | false
}

/**
 * Skeleton loader for ProductDetailPage
 * Matches the layout of the product detail page
 */
const ProductDetailSkeleton = ({ animation = 'wave' }: ProductDetailSkeletonProps) => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left Column - Product Images */}
        <Grid item xs={12} md={6}>
          {/* Main Image */}
          <Skeleton
            variant="rectangular"
            height={500}
            animation={animation}
            sx={{
              borderRadius: 2,
              bgcolor: 'action.hover',
              mb: 2,
            }}
          />

          {/* Thumbnail Images */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={80}
                height={80}
                animation={animation}
                sx={{
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                }}
              />
            ))}
          </Box>
        </Grid>

        {/* Right Column - Product Info */}
        <Grid item xs={12} md={6}>
          <Box>
            {/* Category */}
            <Skeleton variant="text" width="30%" height={20} animation={animation} sx={{ mb: 1 }} />

            {/* Product Name */}
            <Skeleton variant="text" width="80%" height={40} animation={animation} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={40} animation={animation} sx={{ mb: 2 }} />

            {/* Rating */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Skeleton variant="rectangular" width={120} height={24} animation={animation} />
              <Skeleton variant="text" width={80} height={20} animation={animation} />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Price */}
            <Skeleton variant="text" width="40%" height={48} animation={animation} sx={{ mb: 3 }} />

            {/* Description */}
            <Skeleton
              variant="text"
              width="100%"
              height={20}
              animation={animation}
              sx={{ mb: 1 }}
            />
            <Skeleton variant="text" width="95%" height={20} animation={animation} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="90%" height={20} animation={animation} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="70%" height={20} animation={animation} sx={{ mb: 3 }} />

            <Divider sx={{ my: 3 }} />

            {/* Stock & Brand Info */}
            <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width="60%"
                  height={20}
                  animation={animation}
                  sx={{ mb: 1 }}
                />
                <Skeleton variant="text" width="40%" height={24} animation={animation} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width="60%"
                  height={20}
                  animation={animation}
                  sx={{ mb: 1 }}
                />
                <Skeleton variant="text" width="50%" height={24} animation={animation} />
              </Box>
            </Box>

            {/* Quantity Selector */}
            <Skeleton
              variant="rectangular"
              width={150}
              height={56}
              animation={animation}
              sx={{ borderRadius: 1, mb: 2 }}
            />

            {/* Add to Cart Button */}
            <Skeleton
              variant="rectangular"
              width="100%"
              height={56}
              animation={animation}
              sx={{ borderRadius: 1, mb: 2 }}
            />

            {/* Wishlist Button */}
            <Skeleton
              variant="rectangular"
              width="100%"
              height={48}
              animation={animation}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Reviews Section Skeleton */}
      <Paper sx={{ mt: 6, p: 4 }}>
        <Skeleton variant="text" width="30%" height={36} animation={animation} sx={{ mb: 3 }} />
        {/* Review Items */}
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Skeleton variant="circular" width={40} height={40} animation={animation} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="20%" height={20} animation={animation} />
                <Skeleton variant="rectangular" width={100} height={16} animation={animation} />
              </Box>
            </Box>
            <Skeleton
              variant="text"
              width="100%"
              height={16}
              animation={animation}
              sx={{ mb: 0.5 }}
            />
            <Skeleton variant="text" width="90%" height={16} animation={animation} />
            {i < 3 && <Divider sx={{ mt: 3 }} />}
          </Box>
        ))}
      </Paper>
    </Container>
  )
}

export default ProductDetailSkeleton
