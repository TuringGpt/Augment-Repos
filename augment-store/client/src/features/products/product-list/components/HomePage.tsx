import type { Product } from '@features/products/types'
import { Box, Container, Grid, Typography } from '@mui/material'
import { ProductCardSkeleton } from '@components/skeletons'
import { productService } from '@services/api/products/productService'
import { useEffect, useState } from 'react'
import { useTranslation } from '@hooks/useTranslation'
import ProductCard from './ProductCard'
import PromotionalBanners from './PromotionalBanners'

const HomePage = () => {
  const { t } = useTranslation()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setIsLoading(true)
      try {
        const products = await productService.getFeaturedProducts()
        setFeaturedProducts(products)
      } catch (error) {
        console.error('Failed to fetch featured products:', error)
        setFeaturedProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Promotional Banners Section */}
        <PromotionalBanners />
      </Box>

      {/* Featured Products */}
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          {t('home.featuredProducts')}
        </Typography>

        {isLoading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <ProductCardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : featuredProducts.length > 0 ? (
          <Grid container spacing={3}>
            {featuredProducts.map((product, index) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <ProductCard product={product} index={index} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {t('home.noFeaturedProducts')}
          </Typography>
        )}
      </Box>
    </Container>
  )
}

export default HomePage
