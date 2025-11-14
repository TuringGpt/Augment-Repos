import { Card, CardContent, Skeleton, Box } from '@mui/material'

interface ProductCardSkeletonProps {
  /**
   * Whether to animate the skeleton
   * @default "wave"
   */
  animation?: 'pulse' | 'wave' | false
}

/**
 * Skeleton loader for ProductCard component
 * Matches the structure of ProductCard for consistent layout
 */
const ProductCardSkeleton = ({ animation = 'wave' }: ProductCardSkeletonProps) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Product Image Skeleton */}
      <Skeleton
        variant="rectangular"
        height={200}
        animation={animation}
        sx={{
          bgcolor: 'action.hover',
        }}
      />

      {/* Product Details Skeleton */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Category */}
        <Skeleton variant="text" width="40%" height={16} animation={animation} sx={{ mb: 1 }} />

        {/* Product Name - 2 lines */}
        <Skeleton variant="text" width="90%" height={24} animation={animation} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width="70%" height={24} animation={animation} sx={{ mb: 1.5 }} />

        {/* Rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Skeleton variant="rectangular" width={100} height={20} animation={animation} />
          <Skeleton variant="text" width={40} height={16} animation={animation} />
        </Box>

        {/* Price */}
        <Box sx={{ mt: 'auto' }}>
          <Skeleton variant="text" width="50%" height={32} animation={animation} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProductCardSkeleton
