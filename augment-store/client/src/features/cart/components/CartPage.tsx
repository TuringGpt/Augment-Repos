import { useState } from 'react'
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
} from '@mui/material'
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import { useCartStore } from '@store/cartStore'

const CartPage = () => {
  const navigate = useNavigate()
  const { cart, updateItem, removeItem, removeItems, clearCart } = useCartStore()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [clearCartDialogOpen, setClearCartDialogOpen] = useState(false)
  const [removeItemDialogOpen, setRemoveItemDialogOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<{ id: string; name: string } | null>(null)

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

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateItem(itemId, newQuantity)
    }
  }

  const handleRemoveSelected = () => {
    if (selectedItems.length > 0) {
      removeItems(selectedItems)
      setSelectedItems([])
    }
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

  const handleRemoveItemConfirm = () => {
    if (itemToRemove) {
      removeItem(itemToRemove.id)
      // Also remove from selected items if it was selected
      setSelectedItems((prev) => prev.filter((id) => id !== itemToRemove.id))
      setRemoveItemDialogOpen(false)
      setItemToRemove(null)
    }
  }

  const handleRemoveItemCancel = () => {
    setRemoveItemDialogOpen(false)
    setItemToRemove(null)
  }

  const handleCheckout = () => {
    navigate('/checkout')
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
          onClick={handleRemoveSelected}
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
                        ${item.price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <TextField
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value)
                            if (!isNaN(value)) {
                              handleQuantityChange(item.id, value)
                            }
                          }}
                          size="small"
                          sx={{
                            width: 60,
                            mx: 1,
                            '& input': { textAlign: 'center' },
                          }}
                          inputProps={{
                            min: 1,
                            max: item.product.stock,
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ${item.subtotal.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItemClick(item.id, item.product.name)}
                        aria-label="Remove item"
                      >
                        <DeleteIcon />
                      </IconButton>
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
                  ${cart.subtotal.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Tax (10%):</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ${cart.tax.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Shipping:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {cart.shipping === 0 ? 'FREE' : `$${cart.shipping.toFixed(2)}`}
                </Typography>
              </Box>

              {cart.subtotal < 50 && cart.subtotal > 0 && (
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  Add ${(50 - cart.subtotal).toFixed(2)} more for free shipping!
                </Alert>
              )}

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ${cart.total.toFixed(2)}
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
          <Button onClick={handleRemoveItemCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleRemoveItemConfirm} color="error" variant="contained" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default CartPage
