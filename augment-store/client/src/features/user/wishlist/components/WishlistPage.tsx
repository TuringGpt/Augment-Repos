import { Container, Typography } from '@mui/material'

const WishlistPage = () => {
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        My Wishlist
      </Typography>
      <Typography color="text.secondary">Wishlist items will be displayed here</Typography>
    </Container>
  )
}

export default WishlistPage
