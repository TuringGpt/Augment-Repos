import { Container, Typography } from '@mui/material'

const ProductListPage = () => {
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Products
      </Typography>
      <Typography color="text.secondary">Product list will be displayed here</Typography>
    </Container>
  )
}

export default ProductListPage
