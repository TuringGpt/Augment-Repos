import { useState, useMemo } from 'react'
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Divider,
  Button,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { FilterList as FilterListIcon } from '@mui/icons-material'
import type { Product, ProductFilters, SortBy } from '@features/products/types'
import { mockProducts } from '@data/mockProducts'
import ProductCard from './ProductCard'
import PriceRangeFilter from './PriceRangeFilter'
import RatingFilter from './RatingFilter'
import SortDropdown from './SortDropdown'

const ShopPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Calculate min and max prices from products
  const priceRange = useMemo(() => {
    const prices = mockProducts.map((p) => p.discountPrice || p.price)
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    }
  }, [])

  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    minRating: 0,
    maxRating: 5,
  })

  // Sort state
  const [sortBy, setSortBy] = useState<SortBy>('newest')

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...mockProducts]

    // Apply filters
    result = result.filter((product) => {
      const price = product.discountPrice || product.price

      // Price filter
      if (price < (filters.minPrice || 0) || price > (filters.maxPrice || Infinity)) {
        return false
      }

      // Rating filter
      if (product.rating < (filters.minRating || 0) || product.rating > (filters.maxRating || 5)) {
        return false
      }

      return true
    })

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'price-asc':
          return (a.discountPrice || a.price) - (b.discountPrice || b.price)
        case 'price-desc':
          return (b.discountPrice || b.price) - (a.discountPrice || a.price)
        case 'rating-desc':
          return b.rating - a.rating
        default:
          return 0
      }
    })

    return result
  }, [filters, sortBy])

  const handlePriceChange = (value: [number, number]) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: value[0],
      maxPrice: value[1],
    }))
  }

  const handleRatingChange = (value: [number, number]) => {
    setFilters((prev) => ({
      ...prev,
      minRating: value[0],
      maxRating: value[1],
    }))
  }

  const handleResetFilters = () => {
    setFilters({
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      minRating: 0,
      maxRating: 5,
    })
  }

  const FiltersContent = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filters
        </Typography>
        <Button size="small" onClick={handleResetFilters}>
          Reset
        </Button>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <PriceRangeFilter
        minPrice={priceRange.min}
        maxPrice={priceRange.max}
        value={[filters.minPrice || priceRange.min, filters.maxPrice || priceRange.max]}
        onChange={handlePriceChange}
      />

      <RatingFilter
        value={[filters.minRating || 0, filters.maxRating || 5]}
        onChange={handleRatingChange}
      />
    </Box>
  )

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Left Sidebar - Filters (Desktop) */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <FiltersContent />
            </Paper>
          </Grid>
        )}

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Header with Sort */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile && (
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  Filters
                </Button>
              )}
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                All Products
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({filteredAndSortedProducts.length} items)
              </Typography>
            </Box>

            <SortDropdown value={sortBy} onChange={setSortBy} />
          </Box>

          {/* Products Grid */}
          {filteredAndSortedProducts.length > 0 ? (
            <Grid container spacing={3}>
              {filteredAndSortedProducts.map((product, index) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <ProductCard product={product} index={index} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try adjusting your filters
              </Typography>
              <Button variant="contained" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Mobile Filters Drawer */}
      <Drawer anchor="left" open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}>
        <Box sx={{ width: 300, p: 3 }}>
          <FiltersContent />
        </Box>
      </Drawer>
    </Container>
  )
}

export default ShopPage
