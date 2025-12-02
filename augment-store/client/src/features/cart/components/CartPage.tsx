import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Button,
  Divider,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import { useCartStore } from '@store/cartStore'
import { useCartSync } from '@features/cart/hooks/useCartSync'
import { getItemPrice, getItemSubtotal } from '@utils/cartUtils'
import { useSaveForLater } from '@hooks/useSaveForLater'
import { useUIStore } from '@store/uiStore'
import SavedItems from './SavedItems'

const CartPage = () => {
  const navigate = useNavigate()
  const { cart, removeItemFromCart, updateItemInCart, removeItems, clearCart, isItemUpdating } =
    useCartStore()
  const { refetchCart } = useCartSync()
  const { addItem: addToSaved } = useSaveForLater()
  const { addNotification } = useUIStore()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [clearCartDialogOpen, setClearCartDialogOpen] = useState(false)
  const [removeItemDialogOpen, setRemoveItemDialogOpen] = useState(false)
  const [removeSelectedDialogOpen, setRemoveSelectedDialogOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<{ id: string; name: string } | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  // Refetch cart when page mounts
  useEffect(() => {
    console.log('🔄 Cart page mounted - refetching cart from API')
    refetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedItems(cart?.items.map((item) => item.id) || [])
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
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

  const handleRemoveSelectedClick = () => {
    if (selectedItems.length > 0) {
      setRemoveSelectedDialogOpen(true)
    }
  }

  const handleRemoveSelectedConfirm = () => {
    if (selectedItems.length > 0) {
      removeItems(selectedItems)
      setSelectedItems([])
      setRemoveSelectedDialogOpen(false)
    }
  }

  const handleRemoveSelectedCancel = () => {
    setRemoveSelectedDialogOpen(false)
  }

  const handleClearCartClick = () => {
    setClearCartDialogOpen(true)
  }

  const handleClearCartConfirm = () => {
    clearCart()
    setSelectedItems([])
    setClearCartDialogOpen(false)
  }

  const handleClearCartCancel = () => {
    setClearCartDialogOpen(false)
  }

  const handleRemoveItemClick = (itemId: string, itemName: string) => {
    setItemToRemove({ id: itemId, name: itemName })
    setRemoveItemDialogOpen(true)
  }

  const handleRemoveItemConfirm = async () => {
    if (itemToRemove) {
      setIsRemoving(true)
      try {
        await removeItemFromCart(itemToRemove.id)
        // Also remove from selected items if it was selected
        setSelectedItems((prev) => prev.filter((id) => id !== itemToRemove.id))
        setRemoveItemDialogOpen(false)
        setItemToRemove(null)
      } catch (error) {
        console.error('Failed to remove item:', error)
        // Dialog stays open on error so user can retry
      } finally {
        setIsRemoving(false)
      }
    }
  }

  const handleRemoveItemCancel = () => {
    setRemoveItemDialogOpen(false)
    setItemToRemove(null)
  }

  const handleCheckout = () => {
    navigate('/checkout')
  }

  const handleSaveForLater = async (itemId: string) => {
    const item = cart?.items.find((i) => i.id === itemId)
    if (!item) return

    try {
      // Add to saved items
      addToSaved(item.product, item.quantity)
      // Remove from cart
      await removeItemFromCart(itemId)
      // Remove from selected items if it was selected
      setSelectedItems((prev) => prev.filter((id) => id !== itemId))
      // Show success notification
      addNotification({
        type: 'success',
        message: 'Item saved for later',
        duration: 3000,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save item',
        duration: 5000,
      })
    }
  }

  // Empty cart state
  if (!cart || !cart.items || cart.items.length === 0) {
    console.log('Showing empty cart state')
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper
          sx={{
            p: 8,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <ShoppingCartIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
          <Typography variant="h4" color="text.secondary">
            Your cart is empty
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add some products to get started!
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/products')}>
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    )
  }

  console.log('Rendering cart with items:', cart.items.length)

  const allSelected = cart.items.length > 0 && selectedItems.length === cart.items.length

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Shopping Cart ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
      </Typography>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleRemoveSelectedClick}
          disabled={selectedItems.length === 0}
        >
          Remove Selected ({selectedItems.length})
        </Button>
        <Button variant="outlined" color="warning" onClick={handleClearCartClick}>
          Clear Cart
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Cart Items Table */}
        <Box sx={{ flex: 1 }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selectedItems.length > 0 && !allSelected}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cart.items.map((item) => (
                  <TableRow
                    key={item.id}
                    selected={selectedItems.includes(item.id)}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box
                          component="img"
                          src={item.product.images[0]}
                          alt={item.product.name}
                          sx={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {item.product.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.product.description}
                          </Typography>
                          {item.quantity > item.product.stock && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                              Only {item.product.stock} in stock
                            </Alert>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ${getItemPrice(item).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
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
                            width: 60,
                            mx: 1,
                            '& input': { textAlign: 'center' },
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
                            size={20}
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              marginLeft: '-10px',
                              marginTop: '-10px',
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ${getItemSubtotal(item).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSaveForLater(item.id)}
                        >
                          Save for Later
                        </Button>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItemClick(item.id, item.product.name)}
                          aria-label="Remove item"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Order Summary */}
        <Box sx={{ width: { xs: '100%', lg: 350 } }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Order Summary
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ${(cart.subtotal ?? 0).toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Tax (10%):</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ${(cart.tax ?? 0).toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Shipping:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {(cart.shipping ?? 0) === 0 ? 'FREE' : `$${(cart.shipping ?? 0).toFixed(2)}`}
                </Typography>
              </Box>

              {(cart.subtotal ?? 0) < 50 && (cart.subtotal ?? 0) > 0 && (
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  Add ${(50 - (cart.subtotal ?? 0)).toFixed(2)} more for free shipping!
                </Alert>
              )}

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ${(cart.total ?? 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleCheckout}
                sx={{ py: 1.5 }}
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Clear Cart Confirmation Dialog */}
      <Dialog
        open={clearCartDialogOpen}
        onClose={handleClearCartCancel}
        aria-labelledby="clear-cart-dialog-title"
        aria-describedby="clear-cart-dialog-description"
      >
        <DialogTitle id="clear-cart-dialog-title">Clear Cart?</DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-cart-dialog-description">
            Are you sure you want to remove all items from your cart? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearCartCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClearCartConfirm} color="warning" variant="contained" autoFocus>
            Clear Cart
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Individual Item Confirmation Dialog */}
      <Dialog
        open={removeItemDialogOpen}
        onClose={handleRemoveItemCancel}
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
          <Button onClick={handleRemoveItemCancel} color="primary" disabled={isRemoving}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoveItemConfirm}
            color="error"
            variant="contained"
            autoFocus
            disabled={isRemoving}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Selected Items Confirmation Dialog */}
      <Dialog
        open={removeSelectedDialogOpen}
        onClose={handleRemoveSelectedCancel}
        aria-labelledby="remove-selected-dialog-title"
        aria-describedby="remove-selected-dialog-description"
      >
        <DialogTitle id="remove-selected-dialog-title">Remove Selected Items?</DialogTitle>
        <DialogContent>
          <DialogContentText id="remove-selected-dialog-description">
            Are you sure you want to remove <strong>{selectedItems.length}</strong> selected{' '}
            {selectedItems.length === 1 ? 'item' : 'items'} from your cart?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveSelectedCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRemoveSelectedConfirm} color="error" variant="contained" autoFocus>
            Remove {selectedItems.length} {selectedItems.length === 1 ? 'Item' : 'Items'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Saved Items Section */}
      <SavedItems />
    </Container>
  )
}

export default CartPage
