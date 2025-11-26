import { useState, useEffect } from 'react'
import { Box, Typography, Grid, IconButton, CircularProgress } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { productService } from '@services/api/products/productService'
import type { Product } from '@features/products/types'
import ProductCard from '@features/products/product-list/components/ProductCard'
import { useTranslation } from '@hooks/useTranslation'

const RecommendedProducts = () => {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      setLoading(true)
      try {
        const response = await productService.getRecommendedProducts(currentPage)
        setProducts(response.products)
        setTotalPages(response.totalPages)
      } catch (error) {
        console.error('Failed to fetch recommended products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendedProducts()
  }, [currentPage])

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <Box sx={{ py: 6 }}>
      {/* Section Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('product.recommendedProducts')}
        </Typography>

        {/* Navigation Buttons */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              size="small"
              sx={{
                border: 1,
                borderColor: 'divider',
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              size="small"
              sx={{
                border: 1,
                borderColor: 'divider',
                '&:disabled': {
                  opacity: 0.5,
                },
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {products.slice(0, 6).map((product, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={product.id}>
            <ProductCard product={product} index={index} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default RecommendedProducts

