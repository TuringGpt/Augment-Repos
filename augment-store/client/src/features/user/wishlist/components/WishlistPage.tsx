import { useEffect } from 'react'
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Alert,
  Paper,
  Button,
  Grid,
} from '@mui/material'
import { FavoriteBorder } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useWishlistStore } from '@store/wishlistStore'
import { useAuthStore } from '@store/authStore'
import { useWishlistSync } from '../hooks/useWishlistSync'
import ProductCard from '@features/products/product-list/components/ProductCard'

const WishlistPage = () => {
  const navigate = useNavigate()
  const { wishlist, isLoading, error } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()
  const { fetchWishlist } = useWishlistSync()

  // Fetch wishlist when component mounts or when authentication status changes
  useEffect(() => {
    fetchWishlist()
  }, [isAuthenticated, fetchWishlist])

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        My Wishlist
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!isLoading && !error && (wishlist.length === 0 || !isAuthenticated) && (
        <Paper
          sx={{
            p: 8,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <FavoriteBorder sx={{ fontSize: 80, color: 'text.secondary' }} />
          <Typography variant="h5" color="text.secondary">
            Your wishlist is empty
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Save your favorite items to your wishlist and shop them later!
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </Paper>
      )}

      {!isLoading && !error && wishlist.length > 0 && isAuthenticated && (
        <>
          <Typography color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            {wishlist.length} item{wishlist.length === 1 ? '' : 's'} in your wishlist
          </Typography>

          <Grid container spacing={3}>
            {wishlist.map((product, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard product={product} index={index} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  )
}

export default WishlistPage
