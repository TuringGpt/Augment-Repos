import { useState, useEffect } from 'react'
import { Container, Typography, Box, Grid, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { mockProductService } from '@services/api/products/mockProductService'
import ProductCard from './ProductCard'
import type { Product } from '@features/products/types'

const HomePage = () => {
  const navigate = useNavigate()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const products = await mockProductService.getProducts()
        // Get first 6 products as featured
        setFeaturedProducts(products.slice(0, 6))
      } catch (error) {
        console.error('Failed to fetch featured products:', error)
      }
    }

    fetchFeaturedProducts()
  }, [])

  return (
    <Container maxWidth="xl">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" gutterBottom>
          Welcome to Augment Store
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Your one-stop e-commerce solution
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/products')}
          sx={{ mt: 2 }}
        >
          Shop Now
        </Button>
      </Box>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <Box sx={{ py: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
            Featured Products
          </Typography>
          <Grid container spacing={3}>
            {featuredProducts.map((product, index) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <ProductCard product={product} index={index} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  )
}

export default HomePage
