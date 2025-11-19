import { useEffect } from 'react'
import { Container, Typography, CircularProgress, Box, Alert } from '@mui/material'
import { useWishlistStore } from '@store/wishlistStore'
import { useWishlistSync } from '../hooks/useWishlistSync'

const WishlistPage = () => {
  const { wishlist, isLoading, error } = useWishlistStore()
  const { fetchWishlist } = useWishlistSync()

  // Fetch wishlist on mount
  useEffect(() => {
    fetchWishlist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        My Wishlist
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!isLoading && !error && (
        <>
          <Typography color="text.secondary" gutterBottom>
            {wishlist.length === 0
              ? 'Your wishlist is empty'
              : `You have ${wishlist.length} item${wishlist.length === 1 ? '' : 's'} in your wishlist`}
          </Typography>

          {/* Product grid will be implemented in Task 4 */}
          {wishlist.length > 0 && (
            <Box sx={{ mt: 3 }}>
              {wishlist.map((product) => (
                <Typography key={product.id} variant="body2">
                  {product.name} - ${product.price}
                </Typography>
              ))}
            </Box>
          )}
        </>
      )}
    </Container>
  )
}

export default WishlistPage
