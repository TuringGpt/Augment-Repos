import type { Product, ProductFilters, SortBy } from '@features/products/types'
import { FilterList as FilterListIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  Grid,
  Pagination,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { productService } from '@services/api/products/productService'
import { useEffect, useMemo, useState } from 'react'
import PriceRangeFilter from './PriceRangeFilter'
import ProductCard from './ProductCard'
import RatingFilter from './RatingFilter'
import SortDropdown from './SortDropdown'

const PRODUCTS_PER_PAGE = 100 // Match backend page size

const ShopPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // API state
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiPage, setApiPage] = useState(1) // Backend page (100 items per page)
  const [clientPage, setClientPage] = useState(1) // Frontend page (100 items per page, matches backend)
  const [totalCount, setTotalCount] = useState(0)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Calculate min and max prices from products
  const priceRange = useMemo(() => {
    if (products.length === 0) {
      return { min: 0, max: 1000 }
    }
    const prices = products.map((p) => p.discountPrice || p.price)
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    }
  }, [products])

  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    minPrice: 0,
    maxPrice: 1000,
    minRating: 0,
    maxRating: 10,
  })

  // Sort state
  const [sortBy, setSortBy] = useState<SortBy>('newest')

  // Fetch products from API (backend returns 100 items per page)
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await productService.getProducts({
          page: apiPage,
          minRating: filters.minRating,
          maxRating: filters.maxRating,
        })

        console.log('📦 API Response:', {
          productsCount: response.products.length,
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
          appliedFilters: {
            minRating: filters.minRating,
            maxRating: filters.maxRating,
          },
        })

        setProducts(response.products)
        setTotalCount(response.total)
        setHasLoadedOnce(true)
      } catch (err) {
        console.error('Failed to fetch products:', err)
        setError('Failed to load products. Please try again later.')
        setProducts([])
        setTotalCount(0)
        setHasLoadedOnce(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [apiPage, filters.minRating, filters.maxRating])

  // Update filter price range when products change
  useEffect(() => {
    if (products.length > 0 && filters.minPrice === 0 && filters.maxPrice === 1000) {
      setFilters((prev) => ({
        ...prev,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
      }))
    }
  }, [priceRange, products.length, filters.minPrice, filters.maxPrice])

  // Calculate client-side pagination (no filtering or sorting for now)
  const totalClientPages = Math.ceil(products.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const startIndex = (clientPage - 1) * PRODUCTS_PER_PAGE
    const endIndex = startIndex + PRODUCTS_PER_PAGE

    console.log('📊 Pagination Info:', {
      totalProducts: products.length,
      clientPage,
      totalClientPages,
      startIndex,
      endIndex,
      paginatedCount: products.slice(startIndex, endIndex).length,
    })

    return products.slice(startIndex, endIndex)
  }, [products, clientPage, totalClientPages])

  // Handle page change (client-side pagination)
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setClientPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset client page when products change
  useEffect(() => {
    setClientPage(1)
  }, [products.length])

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
      maxRating: 10,
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
        value={[filters.minRating || 0, filters.maxRating || 10]}
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
                ({totalCount} {totalCount === 1 ? 'item' : 'items'})
              </Typography>
            </Box>

            <SortDropdown value={sortBy} onChange={setSortBy} />
          </Box>

          {/* Loading State */}
          {isLoading || !hasLoadedOnce ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            /* Error State */
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="error" gutterBottom>
                {error}
              </Typography>
              <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
                Retry
              </Button>
            </Paper>
          ) : paginatedProducts.length > 0 ? (
            /* Products Grid */
            <>
              <Grid container spacing={3}>
                {paginatedProducts.map((product, index) => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <ProductCard product={product} index={index} />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalClientPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                  <Pagination
                    count={totalClientPages}
                    page={clientPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          ) : (
            /* No Products Found */
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {products.length === 0
                  ? 'No products available at the moment.'
                  : 'Try adjusting your filters'}
              </Typography>
              {products.length > 0 && (
                <Button variant="contained" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              )}
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
