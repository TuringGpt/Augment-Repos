import { useState, useMemo } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  TextField,
  Typography,
} from '@mui/material'
import { useCartStore } from '@/store/cartStore'

import { Delete as DeleteIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'

import { getItemPrice, getItemSubtotal } from '@utils/cartUtils'

interface OrderSummaryProps {
  isContactInfoComplete?: boolean
  isShippingAddressComplete?: boolean
  isBillingAddressComplete?: boolean
}

const OrderSummary = ({
  isContactInfoComplete = false,
  isShippingAddressComplete = false,
  isBillingAddressComplete = false,
}: OrderSummaryProps) => {
  const { cart, updateItemInCart, removeItem } = useCartStore()
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<{ id: string; name: string } | null>(null)

  // Derived state: calculate total item count
  const itemCount = useMemo(() => {
    return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0
  }, [cart?.items])

  // Check if all forms are complete
  const isAllFormsComplete = useMemo(() => {
    return isContactInfoComplete && isShippingAddressComplete && isBillingAddressComplete
  }, [isContactInfoComplete, isShippingAddressComplete, isBillingAddressComplete])

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      try {
        await updateItemInCart(itemId, newQuantity)
      } catch (error) {
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

  const handlePlaceOrder = () => {
    // TODO: Implement order placement logic
  }

  // Early return if cart data is not available
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <Card
        sx={{
          width: { xs: '100%', lg: 500 },
          position: { xs: 'relative', lg: 'sticky' },
          top: { lg: 80 },
          p: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 6,
            gap: 2,
          }}
        >
          <Typography variant="h5" fontWeight={600}>
            Order Summary
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Your cart is empty
          </Typography>
        </Box>
      </Card>
    )
  }

  return (
    <>
      <Card
        sx={{
          width: { xs: '100%', lg: 500 },
          position: { xs: 'relative', lg: 'sticky' },
          top: { lg: 80 },
          p: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h4"
            fontWeight={600}
            sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            Order Summary
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {cart.itemCount || itemCount} item(s)
          </Typography>
        </Box>
        <Divider />

        <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {cart.items.map((item) => (
            <ListItem
              key={item.id}
              sx={{
                flexDirection: 'column',
                alignItems: 'stretch',
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1, sm: 2 },
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, mb: 1.5 }}>
                {/* Product Image */}
                <Avatar
                  src={item.product.images[0]}
                  alt={item.product.name}
                  variant="rounded"
                  sx={{ width: { xs: 60, sm: 80 }, height: { xs: 60, sm: 80 } }}
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
                      fontSize: { xs: '0.875rem', sm: '0.875rem' },
                    }}
                  >
                    {item.product.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    ${getItemPrice(item).toFixed(2)} each
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: 'primary.main',
                      fontSize: { xs: '0.875rem', sm: '0.875rem' },
                    }}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Quantity:
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  sx={{ p: { xs: 0.5, sm: 1 } }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <TextField
                  type="number"
                  value={item.quantity}
                  disabled
                  size="small"
                  sx={{
                    width: { xs: 50, sm: 'fit-content' },
                    '& input': {
                      textAlign: 'center',
                      py: { xs: 0.25, sm: 0.5 },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    },
                  }}
                  inputProps={{
                    min: 1,
                    max: item.product.quantity ?? item.product.stock,
                    inputMode: 'numeric',
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleQuantityChange(item.id, Number(item.quantity || 0) + 1)}
                  disabled={item.quantity >= (item.product.quantity ?? item.product.stock)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                {item.quantity >= (item.product.quantity ?? item.product.stock) && (
                  <Typography
                    variant="caption"
                    color="warning.main"
                    sx={{ ml: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                  >
                    Max quantity
                  </Typography>
                )}
              </Box>
            </ListItem>
          ))}
        </List>

        <Grid container spacing={1} py={2}>
          <Grid item xs={6}>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Subtotal
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography align="right" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              ${(cart.subtotal ?? 0).toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Tax
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography align="right" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              ${(cart.tax ?? 0).toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Delivery Fee
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography align="right" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              ${(cart.shipping ?? 0).toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Discount
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography align="right" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              ${(0).toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
              Total
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography
              align="right"
              sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem' } }}
            >
              ${(cart.total ?? 0).toFixed(2)}
            </Typography>
          </Grid>
        </Grid>

        <Divider />

        {/* Discount input */}
        <Grid
          container
          spacing={{ xs: 1.5, sm: 1 }}
          py={{ xs: 1.5, sm: 2 }}
          sx={{ alignItems: 'center' }}
        >
          <Grid item xs={12} sm={6}>
            <Typography
              component="label"
              htmlFor="discount-code-input"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Discount Code
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="discount-code-input"
              type="text"
              placeholder="Enter discount code"
              size="small"
              fullWidth
              inputProps={{
                'aria-label': 'Discount code',
              }}
              sx={{
                '& input': { fontSize: { xs: '0.875rem', sm: '1rem' } },
              }}
            />
          </Grid>
        </Grid>

        {/* Agreement */}
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            By placing an order, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </Typography>
        </Box>
        <Box py={{ xs: 1.5, sm: 2 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handlePlaceOrder}
            disabled={!isAllFormsComplete}
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, py: { xs: 1, sm: 1.5 } }}
          >
            Place Order
          </Button>
        </Box>
      </Card>
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
    </>
  )
}

export default OrderSummary
