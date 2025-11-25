import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Alert,
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
  CircularProgress,
} from '@mui/material'
import { useCartStore } from '@/store/cartStore'
import { useOrderStore } from '@/store/orderStore'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, StripeEmbeddedCheckout } from '@stripe/stripe-js'

import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'

import { getItemPrice, getItemSubtotal } from '@utils/cartUtils'
import { paymentService } from '@services/api/payment/paymentService'
import { STRIPE_CONFIG } from '@config/api'
import type { CreateOrderResponse } from '@features/orders/types'

interface ContactInfo {
  email: string
  phone: string
  firstName: string
  lastName: string
}

interface AddressInfo {
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface OrderSummaryProps {
  isContactInfoComplete?: boolean
  isShippingAddressComplete?: boolean
  isBillingAddressComplete?: boolean
  contactInfo: ContactInfo
  shippingAddress: AddressInfo
  billingAddress: AddressInfo
}

const OrderSummary = ({
  isContactInfoComplete = false,
  isShippingAddressComplete = false,
  isBillingAddressComplete = false,
  contactInfo,
  shippingAddress,
  billingAddress,
}: OrderSummaryProps) => {
  const { cart, updateItemInCart, removeItemFromCart } = useCartStore()
  const { createOrder, isCreatingOrder, setCreateOrderError } = useOrderStore()
  const navigate = useNavigate()
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<{ id: string; name: string } | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<CreateOrderResponse | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null)

  // Derived state: calculate total item count
  const itemCount = useMemo(() => {
    return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0
  }, [cart?.items])

  // Check if all forms are complete
  const isAllFormsComplete = useMemo(() => {
    return isContactInfoComplete && isShippingAddressComplete && isBillingAddressComplete
  }, [isContactInfoComplete, isShippingAddressComplete, isBillingAddressComplete])

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      const stripeInstance = await loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY)
      setStripe(stripeInstance)
    }
    initStripe()
  }, [])

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

  const handleRemoveConfirm = async () => {
    if (itemToRemove) {
      setIsRemoving(true)
      try {
        await removeItemFromCart(itemToRemove.id)
        setRemoveDialogOpen(false)
        setItemToRemove(null)
      } catch (error) {
        console.error('Failed to remove item:', error)
        // Dialog stays open on error so user can retry
      } finally {
        setIsRemoving(false)
      }
    }
  }

  const handleRemoveCancel = () => {
    setRemoveDialogOpen(false)
    setItemToRemove(null)
  }

  const handlePlaceOrder = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      console.error('Cannot place order: cart is empty')
      return
    }

    if (!stripe) {
      setPaymentError('Payment system is not ready. Please refresh the page and try again.')
      return
    }

    setIsProcessingPayment(true)
    setPaymentError(null)
    setCreateOrderError(null)

    try {
      const cartItemIds = cart.items.map((item) => item.id)
      const orderData = {
        cart_items: cartItemIds,
        shipping_address: {
          first_name: contactInfo.firstName,
          last_name: contactInfo.lastName,
          address_line_1: shippingAddress.address1,
          address_line_2: shippingAddress.address2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
        billing_address: {
          first_name: contactInfo.firstName,
          last_name: contactInfo.lastName,
          address_line_1: billingAddress.address1,
          address_line_2: billingAddress.address2 || '',
          city: billingAddress.city,
          state: billingAddress.state,
          postal_code: billingAddress.postalCode,
          country: billingAddress.country,
        },
        contact_information: {
          first_name: contactInfo.firstName,
          last_name: contactInfo.lastName,
          email: contactInfo.email,
          phone: contactInfo.phone,
        },
      }

      const order = await createOrder(orderData)

      const sessionResponse = await paymentService.createPaymentSession({
        order: order.id,
        payment_method: 'stripe',
      })

      setClientSecret(sessionResponse.client_secret)
      setShowCheckout(true)
    } catch (error) {
      console.error('Failed to place order or initialize payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process order'
      setPaymentError(errorMessage)
      setShowCheckout(false)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Mount Stripe checkout when container is ready
  useEffect(() => {
    const mountCheckout = async () => {
      if (showCheckout && clientSecret && stripe && !checkoutRef.current) {
        try {
          const checkout = await stripe.initEmbeddedCheckout({
            clientSecret: clientSecret,
          })
          checkoutRef.current = checkout
          checkout.mount('#checkout-container')
        } catch (error) {
          console.error('Failed to mount checkout:', error)
          setPaymentError('Failed to load payment form. Please try again.')
          setShowCheckout(false)
        }
      }
    }

    mountCheckout()
  }, [showCheckout, clientSecret, stripe])

  // Cleanup checkout on unmount
  useEffect(() => {
    return () => {
      if (checkoutRef.current) {
        checkoutRef.current.unmount()
        checkoutRef.current = null
      }
    }
  }, [])

  const handleConfirmationClose = () => {
    setConfirmationDialogOpen(false)
    // Navigate to the home page after closing
    navigate('/')
  }

  const handleViewOrderDetails = () => {
    if (confirmedOrder) {
      setConfirmationDialogOpen(false)
      navigate(`/orders/${confirmedOrder.id}`)
    }
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
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
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
                    '& input': { textAlign: 'center', py: { xs: 0.25, sm: 0.5 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } },
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
                  disabled={item.quantity >= (item?.product?.quantity ?? item.product.stock)}
                  sx={{ p: { xs: 0.5, sm: 1 } }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                {item.quantity >= (item?.product?.quantity ?? item.product.stock) && (
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
            <Typography align="right" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
              ${(cart.total ?? 0).toFixed(2)}
            </Typography>
          </Grid>
        </Grid>

        <Divider />

        {/* Discount input */}
        <Grid container spacing={{ xs: 1.5, sm: 1 }} py={{ xs: 1.5, sm: 2 }} sx={{ alignItems: 'center' }}>
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
        <Box sx={{ mb: 2 }}>
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

        {/* Error message */}
        {paymentError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {paymentError}
          </Alert>
        )}

        {!showCheckout && (
          <Box py={{ xs: 1.5, sm: 2 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handlePlaceOrder}
              disabled={!isAllFormsComplete || isCreatingOrder || isProcessingPayment || !stripe}
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, py: { xs: 1, sm: 1.5 } }}
            >
              {isProcessingPayment ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Initializing Payment...
                </Box>
              ) : isCreatingOrder ? (
                'Placing Order...'
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </Box>
        )}

        {/* Stripe Embedded Checkout Container */}
        {showCheckout && (
          <Box
            id="checkout-container"
            sx={{
              minHeight: '400px',
              mb: 2,
            }}
          />
        )}
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
          <Button onClick={handleRemoveCancel} color="primary" disabled={isRemoving}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoveConfirm}
            color="error"
            variant="contained"
            autoFocus
            disabled={isRemoving}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Confirmation Dialog */}
      <Dialog
        open={confirmationDialogOpen}
        onClose={handleConfirmationClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="order-confirmation-dialog-title"
        aria-describedby="order-confirmation-dialog-description"
      >
        <DialogTitle id="order-confirmation-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" fontWeight={600}>
                Order Confirmed!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thank you for your purchase
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography id="order-confirmation-dialog-description" variant="body1" color="text.secondary" gutterBottom>
              Your order has been successfully placed and is being processed.
            </Typography>

            {confirmedOrder && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Order ID
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {confirmedOrder.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Order Date
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(confirmedOrder.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                      {confirmedOrder.status}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Shipping Address
                    </Typography>
                    <Typography variant="body2">
                      {confirmedOrder.shipping_address.first_name} {confirmedOrder.shipping_address.last_name}
                    </Typography>
                    <Typography variant="body2">
                      {confirmedOrder.shipping_address.address_line_1}
                    </Typography>
                    {confirmedOrder.shipping_address.address_line_2 && (
                      <Typography variant="body2">
                        {confirmedOrder.shipping_address.address_line_2}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {confirmedOrder.shipping_address.city}, {confirmedOrder.shipping_address.state}{' '}
                      {confirmedOrder.shipping_address.postal_code}
                    </Typography>
                    <Typography variant="body2">{confirmedOrder.shipping_address.country}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Contact Information
                    </Typography>
                    <Typography variant="body2">{confirmedOrder.contact_information.email}</Typography>
                    <Typography variant="body2">{confirmedOrder.contact_information.phone}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              A confirmation email has been sent to{' '}
              <strong>{confirmedOrder?.contact_information.email}</strong>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleConfirmationClose} color="primary" variant="outlined">
            Continue Shopping
          </Button>
          <Button onClick={handleViewOrderDetails} color="primary" variant="contained" autoFocus>
            View Order Details
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default OrderSummary
