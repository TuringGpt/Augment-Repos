import { Container, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'

const OrderDetailPage = () => {
  const { id } = useParams()

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Order Detail
      </Typography>
      <Typography color="text.secondary">Order ID: {id}</Typography>
    </Container>
  )
}

export default OrderDetailPage
