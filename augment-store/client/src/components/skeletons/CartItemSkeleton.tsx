import { Box, Skeleton, Divider } from '@mui/material'

interface CartItemSkeletonProps {
  /**
   * Whether to animate the skeleton
   * @default true
   */
  animation?: 'pulse' | 'wave' | false
  /**
   * Whether to show divider after the item
   * @default true
   */
  showDivider?: boolean
}

/**
 * Skeleton loader for individual cart items
 * Used in CartDrawer and CartPage
 */
const CartItemSkeleton = ({ animation = 'wave', showDivider = true }: CartItemSkeletonProps) => {
  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
        {/* Product Image */}
        <Skeleton
          variant="rectangular"
          width={80}
          height={80}
          animation={animation}
          sx={{
            borderRadius: 1,
            bgcolor: 'action.hover',
            flexShrink: 0,
          }}
        />

        {/* Product Details */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Product Name */}
          <Box>
            <Skeleton variant="text" width="80%" height={20} animation={animation} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="40%" height={16} animation={animation} />
          </Box>

          {/* Price and Quantity */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton variant="text" width={80} height={24} animation={animation} />
            <Skeleton
              variant="rectangular"
              width={100}
              height={32}
              animation={animation}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </Box>

        {/* Remove Button */}
        <Skeleton
          variant="circular"
          width={32}
          height={32}
          animation={animation}
          sx={{ flexShrink: 0 }}
        />
      </Box>

      {showDivider && <Divider />}
    </>
  )
}

export default CartItemSkeleton

