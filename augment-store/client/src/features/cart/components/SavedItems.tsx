import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Button,
  Divider,
} from '@mui/material'
import { Delete as DeleteIcon, ShoppingCart as CartIcon } from '@mui/icons-material'
import { useSaveForLater } from '@hooks/useSaveForLater'
import { useCartStore } from '@store/cartStore'
import { useTranslation } from '@hooks/useTranslation'
import { useUIStore } from '@store/uiStore'
import { PLACEHOLDER_IMAGE } from '@features/products/types/api'

const SavedItems = () => {
  const { t } = useTranslation()
  const { items, removeItem, clearAll } = useSaveForLater()
  const { addItemToCart } = useCartStore()
  const { addNotification } = useUIStore()
  const [movingItems, setMovingItems] = useState<Set<string>>(new Set())

  const handleMoveToCart = async (productId: string, quantity: number) => {
    setMovingItems((prev) => new Set(prev).add(productId))
    try {
      await addItemToCart(productId, quantity)
      removeItem(productId)
      addNotification({
        type: 'success',
        message: t('cart.movedToCart'),
        duration: 3000,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to move item to cart',
        duration: 5000,
      })
    } finally {
      setMovingItems((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const handleRemove = (productId: string) => {
    removeItem(productId)
    addNotification({
      type: 'success',
      message: t('cart.removedFromSaved'),
      duration: 3000,
    })
  }

  if (items.length === 0) {
    return null
  }

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          {t('cart.savedItems')} ({items.length})
        </Typography>
        {items.length > 0 && (
          <Button variant="outlined" size="small" onClick={clearAll}>
            {t('common.clear')}
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {items.map((item) => {
          const isMoving = movingItems.has(item.product.id)
          const imageUrl = item.product.images[0] || PLACEHOLDER_IMAGE

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.product.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={imageUrl}
                  alt={item.product.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap>
                    {item.product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ${item.product.price.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('cart.quantity')}: {item.quantity}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    startIcon={<CartIcon />}
                    onClick={() => handleMoveToCart(item.product.id, item.quantity)}
                    disabled={isMoving}
                  >
                    {isMoving ? t('common.loading') : t('cart.moveToCart')}
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemove(item.product.id)}
                    disabled={isMoving}
                    aria-label={t('cart.removeItem')}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Paper>
  )
}

export default SavedItems
