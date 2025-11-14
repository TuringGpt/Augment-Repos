import { Card, CardContent, Skeleton, Box } from '@mui/material'

interface CategoryCardSkeletonProps {
  /**
   * Whether to animate the skeleton
   * @default true
   */
  animation?: 'pulse' | 'wave' | false
}

/**
 * Skeleton loader for Category/Brand card components
 * Used in CategoriesPage and BrandsPage
 */
const CategoryCardSkeleton = ({ animation = 'wave' }: CategoryCardSkeletonProps) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Category/Brand Image Skeleton */}
      <Skeleton
        variant="rectangular"
        height={200}
        animation={animation}
        sx={{
          bgcolor: 'action.hover',
        }}
      />

      {/* Category/Brand Info Skeleton */}
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Name */}
        <Skeleton
          variant="text"
          width="70%"
          height={28}
          animation={animation}
          sx={{ mx: 'auto', mb: 1 }}
        />

        {/* Description - 2 lines */}
        <Skeleton
          variant="text"
          width="90%"
          height={16}
          animation={animation}
          sx={{ mx: 'auto', mb: 0.5 }}
        />
        <Skeleton
          variant="text"
          width="60%"
          height={16}
          animation={animation}
          sx={{ mx: 'auto' }}
        />
      </CardContent>
    </Card>
  )
}

export default CategoryCardSkeleton

