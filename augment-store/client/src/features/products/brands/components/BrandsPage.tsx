import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Box,
  Fade,
} from '@mui/material'
import { Storefront as BrandIcon } from '@mui/icons-material'
import { CategoryCardSkeleton } from '@components/skeletons'
import { productService } from '@services/api/products/productService'
import type { Brand } from '@features/products/types'

const BrandsPage = () => {
  const navigate = useNavigate()
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true)
      try {
        const fetchedBrands = await productService.getBrands()
        setBrands(fetchedBrands)
      } catch (error) {
        console.error('Failed to fetch brands:', error)
        setBrands([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBrands()
  }, [])

  const handleBrandClick = (brand: Brand) => {
    // Navigate to products page with brand filter
    if (!brand.name) return
    const brandSlug = brand.name.toLowerCase().replace(/\s+/g, '-')
    navigate(`/products?brand=${encodeURIComponent(brandSlug)}`)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Title */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 700,
          mb: 4,
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        Shop by Brand
      </Typography>

      {/* Loading State */}
      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <CategoryCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : brands.length > 0 ? (
        /* Brands Grid */
        <Grid container spacing={3}>
          {brands.map((brand, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={brand.id}>
              <Fade
                in={true}
                timeout={300 + index * 50}
                style={{ transitionDelay: `${index * 30}ms` }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleBrandClick(brand)}
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                    }}
                  >
                    {/* Brand Image */}
                    {brand.image ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={brand.image}
                        alt={brand.name}
                        sx={{
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      /* Fallback Icon */
                      <Box
                        sx={{
                          height: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.200',
                        }}
                      >
                        <BrandIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                      </Box>
                    )}

                    {/* Brand Info */}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                      >
                        {brand.name}
                      </Typography>
                      {brand.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {brand.description}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Empty State */
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          No brands available at the moment.
        </Typography>
      )}
    </Container>
  )
}

export default BrandsPage
