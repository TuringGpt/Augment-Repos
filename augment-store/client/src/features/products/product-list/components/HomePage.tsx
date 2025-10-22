import type { Product } from '@features/products/types'
import { Box, Container, Grid, Typography } from '@mui/material'
import { mockProductService } from '@services/api/products/mockProductService'
import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import PromotionalBanners from './PromotionalBanners'

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { products } = await mockProductService.getProducts()
        // Get first 6 products as featured
        setFeaturedProducts(products.slice(0, 6))
      } catch (error) {
        console.error('Failed to fetch featured products:', error)
      }
    }

    fetchFeaturedProducts()
  }, [])

  return (
    <Container maxWidth="xl" disableGutters>
      <Box sx={{ py: 4 }}>
        {/* Promotional Banners Section */}
        <PromotionalBanners />
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
