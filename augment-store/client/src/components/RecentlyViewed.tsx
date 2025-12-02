import { useState, useEffect } from 'react'
import { Box, Typography, Grid, Button, IconButton } from '@mui/material'
import { Clear as ClearIcon } from '@mui/icons-material'
import { useRecentlyViewed } from '@hooks/useRecentlyViewed'
import { useTranslation } from '@hooks/useTranslation'
import ProductCard from '@features/products/product-list/components/ProductCard'
import type { Product } from '@features/products/types'

interface RecentlyViewedProps {
  /**
   * Maximum number of products to display
   * @default 6
   */
  maxItems?: number
  /**
   * Product ID to exclude from the list (e.g., current product on detail page)
   */
  excludeProductId?: string
  /**
   * Show clear all button
   * @default true
   */
  showClearButton?: boolean
}

/**
 * RecentlyViewed Component
 * 
 * Displays a grid of recently viewed products.
 * Automatically excludes the current product if on a product detail page.
 * 
 * @example
 * ```tsx
 * // On homepage - show 6 most recent
 * <RecentlyViewed maxItems={6} />
 * 
 * // On product detail page - exclude current product
 * <RecentlyViewed maxItems={4} excludeProductId={currentProductId} />
 * ```
 */
const RecentlyViewed = ({ 
  maxItems = 6, 
  excludeProductId,
  showClearButton = true 
}: RecentlyViewedProps) => {
  const { t } = useTranslation()
  const { getRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const loadRecentlyViewed = () => {
      let recentProducts = getRecentlyViewed()
      
      // Exclude current product if specified
      if (excludeProductId) {
        recentProducts = recentProducts.filter(p => p.id !== excludeProductId)
      }
      
      // Limit to maxItems
      const limitedProducts = recentProducts.slice(0, maxItems)
      
      // Convert to Product type (add missing fields with defaults)
      const convertedProducts: Product[] = limitedProducts.map(p => ({
        ...p,
        reviewCount: 0,
        specifications: undefined,
        reviews: undefined,
        createdAt: p.viewedAt,
        updatedAt: p.viewedAt,
        quantity: p.stock,
      }))
      
      setProducts(convertedProducts)
    }

    loadRecentlyViewed()
    
    // Listen for storage changes (e.g., from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'recently-viewed-products') {
        loadRecentlyViewed()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [getRecentlyViewed, maxItems, excludeProductId])

  const handleClearAll = () => {
    clearRecentlyViewed()
    setProducts([])
  }

  // Don't render if no products
  if (products.length === 0) {
    return null
  }

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('product.recentlyViewed')}
        </Typography>
        {showClearButton && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
            sx={{ textTransform: 'none' }}
          >
            {t('common.clearAll')}
          </Button>
        )}
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {products.map((product, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={product.id}>
            <ProductCard product={product} index={index} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default RecentlyViewed

