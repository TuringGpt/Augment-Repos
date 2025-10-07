import { Container, Typography } from '@mui/material'

const CartPage = () => {
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Shopping Cart
      </Typography>
      <Typography color="text.secondary">
        Cart items will be displayed here
      </Typography>
    </Container>
  )
}

export default CartPage

