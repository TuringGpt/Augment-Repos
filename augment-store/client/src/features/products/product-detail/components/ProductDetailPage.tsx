import { Container, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'

const ProductDetailPage = () => {
  const { id } = useParams()

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Product Detail
      </Typography>
      <Typography color="text.secondary">
        Product ID: {id}
      </Typography>
    </Container>
  )
}

export default ProductDetailPage

