import { useState, type MouseEvent } from 'react'
import { IconButton, CircularProgress, Tooltip } from '@mui/material'
import { Favorite, FavoriteBorder } from '@mui/icons-material'
import { useWishlistStore } from '@store/wishlistStore'
import { useAuthStore } from '@store/authStore'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@hooks/useTranslation'

interface AddToWishlistButtonProps {
  productId: string
  size?: 'small' | 'medium' | 'large'
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  sx?: object
}

const AddToWishlistButton = ({
  productId,
  size = 'medium',
  color = 'error',
  sx = {},
}: AddToWishlistButtonProps) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore()
  const [isLoading, setIsLoading] = useState(false)

  const inWishlist = isInWishlist(productId)
  const isDisabled = isLoading || (isAuthenticated && inWishlist)

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation() // Prevent card click when clicking button

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

  const tooltipTitle = !isAuthenticated
    ? t('wishlist.loginToAddToWishlist')
    : inWishlist
      ? t('wishlist.removeFromWishlist')
      : t('wishlist.addToWishlist')

  // Prevent click propagation to parent CardActionArea when disabled
  const handleWrapperClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.stopPropagation()
    }
  }

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span onClick={handleWrapperClick} style={{ display: 'inline-flex' }}>
        <IconButton
          onClick={handleClick}
          disabled={isLoading}
          color={color}
          size={size}
          aria-label={tooltipTitle}
          sx={{
            ...sx,
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s',
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={size === 'small' ? 16 : size === 'large' ? 28 : 20} />
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
