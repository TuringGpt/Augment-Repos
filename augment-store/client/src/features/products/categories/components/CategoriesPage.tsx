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
import { Category as CategoryIcon } from '@mui/icons-material'
import { CategoryCardSkeleton } from '@components/skeletons'
import { productService } from '@services/api/products/productService'
import type { Category } from '@features/products/types'

const CategoriesPage = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        const fetchedCategories = await productService.getCategories()
        setCategories(fetchedCategories)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryClick = (category: Category) => {
    // Navigate to products page with category filter
    const categorySlug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-')
    navigate(`/products?category=${encodeURIComponent(categorySlug)}`)
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
        Shop by Category
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
      ) : categories.length > 0 ? (
        /* Categories Grid */
        <Grid container spacing={3}>
          {categories.map((category, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
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
                    onClick={() => handleCategoryClick(category)}
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                    }}
                  >
                    {/* Category Image */}
                    {category.image ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={category.image}
                        alt={category.name}
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
                        <CategoryIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                      </Box>
                    )}

                    {/* Category Info */}
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
                        {category.name}
                      </Typography>
                      {category.description && (
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
                          {category.description}
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
          No categories available at the moment.
        </Typography>
      )}
    </Container>
  )
}

export default CategoriesPage
