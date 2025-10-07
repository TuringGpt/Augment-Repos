import { Container, Typography } from '@mui/material'

const OrdersPage = () => {
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>
      <Typography color="text.secondary">
        Order list will be displayed here
      </Typography>
    </Container>
  )
}

export default OrdersPage

