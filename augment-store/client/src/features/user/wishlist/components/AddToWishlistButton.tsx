import { useState } from 'react'
import { IconButton, CircularProgress, Tooltip } from '@mui/material'
import { Favorite, FavoriteBorder } from '@mui/icons-material'
import { useWishlistStore } from '@store/wishlistStore'
import { useAuthStore } from '@store/authStore'
import { useNavigate } from 'react-router-dom'

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
  const { isAuthenticated } = useAuthStore()
  const { isInWishlist, addToWishlist } = useWishlistStore()
  const [isAdding, setIsAdding] = useState(false)

  const inWishlist = isInWishlist(productId)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when clicking button

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Don't add if already in wishlist
    if (inWishlist) {
      return
    }

    try {
      setIsAdding(true)
      await addToWishlist([productId])
    } catch (error) {
      console.error('Failed to add to wishlist:', error)
      // Error is already handled in the store
    } finally {
      setIsAdding(false)
    }
  }

  const tooltipTitle = !isAuthenticated
    ? 'Login to add to wishlist'
    : inWishlist
      ? 'Already in wishlist'
      : 'Add to wishlist'

  const isDisabled = isAdding || (isAuthenticated && inWishlist)

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
          disabled={isDisabled}
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
          {isAdding ? (
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
