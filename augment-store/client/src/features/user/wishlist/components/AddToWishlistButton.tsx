import { useState } from 'react'
import { IconButton, CircularProgress, Tooltip } from '@mui/material'
import { Favorite, FavoriteBorder } from '@mui/icons-material'
import type { SxProps, Theme } from '@mui/system'
import { useWishlistStore } from '@store/wishlistStore'
import { useAuthStore } from '@store/authStore'
import { useNavigate } from 'react-router-dom'

interface AddToWishlistButtonProps {
  productId: string
  size?: 'small' | 'medium' | 'large'
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit'
  sx?: SxProps<Theme>
}

const AddToWishlistButton = ({
  productId,
  size = 'medium',
  color = 'error',
  sx,
}: AddToWishlistButtonProps) => {
  const navigate = useNavigate()
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore()
  const [isLoading, setIsLoading] = useState(false)

  const inWishlist = isInWishlist(productId)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when clicking button

    // Wait for auth store to hydrate before checking authentication
    // This prevents incorrectly redirecting authenticated users on initial load
    if (!hasHydrated) {
      return
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      setIsLoading(true)

      if (inWishlist) {
        // Remove from wishlist
        await removeFromWishlist([productId])
      } else {
        // Add to wishlist
        await addToWishlist([productId])
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error)
      // Error is already handled in the store
    } finally {
      setIsLoading(false)
    }
  }

  // Wait for hydration to show correct tooltip
  const tooltipTitle = !hasHydrated
    ? 'Loading...'
    : !isAuthenticated
      ? 'Login to add to wishlist'
      : inWishlist
        ? 'Remove from wishlist'
        : 'Add to wishlist'

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span>
        <IconButton
          onClick={handleClick}
          disabled={isLoading || !hasHydrated}
          color={color}
          size={size}
          aria-label={tooltipTitle}
          aria-pressed={inWishlist}
          sx={[
            {
              '&:hover': {
                transform: 'scale(1.1)',
                transition: 'transform 0.2s',
              },
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          {isLoading ? (
            <CircularProgress
              size={size === 'small' ? 16 : size === 'large' ? 28 : 20}
              color="inherit"
            />
          ) : inWishlist ? (
            <Favorite />
          ) : (
            <FavoriteBorder />
          )}
        </IconButton>
      </span>
    </Tooltip>
  )
}

export default AddToWishlistButton
