import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  List,
  ListItem,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import { useUIStore } from '@store/uiStore'
import { useCartStore } from '@store/cartStore'
import { useCartSync } from '@features/cart/hooks/useCartSync'
import { getItemPrice, getItemSubtotal } from '@utils/cartUtils'

const CartDrawer = () => {
  const navigate = useNavigate()
  const { isCartDrawerOpen, setCartDrawerOpen } = useUIStore()
  const { cart, updateItemInCart, removeItem, isItemUpdating } = useCartStore()
  const { refetchCart } = useCartSync()
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<{ id: string; name: string } | null>(null)

  // Refetch cart when drawer opens
  useEffect(() => {
    if (isCartDrawerOpen) {
      console.log('🔄 Cart drawer opened - refetching cart from API')
      refetchCart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCartDrawerOpen]) // Only refetch when drawer open state changes

  const handleClose = () => {
    setCartDrawerOpen(false)
  }

  const handleViewCart = () => {
    handleClose()
    navigate('/cart')
  }

  const handleCheckout = () => {
    handleClose()
    navigate('/checkout')
  }

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      try {
        await updateItemInCart(itemId, newQuantity)
      } catch (error) {
        // Error is already handled in the store
        console.error('Failed to update cart item:', error)
      }
    }
  }

  const handleRemoveClick = (itemId: string, itemName: string) => {
    setItemToRemove({ id: itemId, name: itemName })
    setRemoveDialogOpen(true)
  }

  const handleRemoveConfirm = () => {
    if (itemToRemove) {
      removeItem(itemToRemove.id)
      setRemoveDialogOpen(false)
      setItemToRemove(null)
    }
  }

  const handleRemoveCancel = () => {
    setRemoveDialogOpen(false)
    setItemToRemove(null)
  }

  const itemCount = cart?.itemCount || 0
  const hasItems = cart && cart.items && cart.items.length > 0

  return (
    <Drawer
      anchor="right"
      open={isCartDrawerOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 420 },
          maxWidth: '100%',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Shopping Cart ({itemCount})
          </Typography>
          <IconButton onClick={handleClose} aria-label="close cart">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Cart Items */}
        {hasItems ? (
          <>
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {cart.items.map((item) => (
                <ListItem
                  key={item.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    py: 2,
                    px: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                    {/* Product Image */}
                    <Avatar
                      src={item.product.images[0]}
                      alt={item.product.name}
                      variant="rounded"
                      sx={{ width: 80, height: 80 }}
                    />

                    {/* Product Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        ${getItemPrice(item).toFixed(2)} each
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: 'primary.main' }}
                      >
                        ${getItemSubtotal(item).toFixed(2)}
                      </Typography>
                    </Box>

                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveClick(item.id, item.product.name)}
                      aria-label="Remove item"
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Quantity Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      Quantity:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isItemUpdating(item.id)}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <TextField
                        type="number"
                        value={item.quantity}
                        disabled
                        size="small"
                        sx={{
                          width: 50,
                          '& input': { textAlign: 'center', py: 0.5 },
                        }}
                        inputProps={{
                          min: 1,
                          max: item.product.stock,
                          inputMode: 'numeric',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock || isItemUpdating(item.id)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      {isItemUpdating(item.id) && (
                        <CircularProgress
                          size={16}
                          sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            marginLeft: '-8px',
                            marginTop: '-8px',
                          }}
                        />
                      )}
                    </Box>
                    {item.quantity >= item.product.stock && !isItemUpdating(item.id) && (
                      <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                        Max stock
                      </Typography>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>

            {/* Footer with Totals and Actions */}
            <Box sx={{ p: 2, borderTop: 2, borderColor: 'divider' }}>
              {/* Totals */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ${(cart.subtotal ?? 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tax:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ${(cart.tax ?? 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Shipping:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(cart.shipping ?? 0) === 0 ? 'FREE' : `$${(cart.shipping ?? 0).toFixed(2)}`}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Total:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    ${(cart.total ?? 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button variant="contained" size="large" fullWidth onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
                <Button variant="outlined" size="large" fullWidth onClick={handleViewCart}>
                  View Full Cart
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              gap: 2,
            }}
          >
            <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              Your cart is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Add some products to get started!
            </Typography>
            <Button variant="contained" onClick={handleClose} sx={{ mt: 2 }}>
              Continue Shopping
            </Button>
          </Box>
        )}
      </Box>

      {/* Remove Item Confirmation Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={handleRemoveCancel}
        aria-labelledby="remove-item-dialog-title"
        aria-describedby="remove-item-dialog-description"
      >
        <DialogTitle id="remove-item-dialog-title">Remove Item?</DialogTitle>
        <DialogContent>
          <DialogContentText id="remove-item-dialog-description">
            Are you sure you want to remove <strong>{itemToRemove?.name}</strong> from your cart?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRemoveConfirm} color="error" variant="contained" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  )
}

export default CartDrawer
