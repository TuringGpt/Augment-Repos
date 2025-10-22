import { Drawer, Box, Typography, IconButton, Divider } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { useUIStore } from '@store/uiStore'
import { useCartStore } from '@store/cartStore'

const CartDrawer = () => {
  const { isCartDrawerOpen, setCartDrawerOpen } = useUIStore()
  const { cart, getItemCount } = useCartStore()

  const handleClose = () => {
    setCartDrawerOpen(false)
  }

  const itemCount = getItemCount()

  return (
    <Drawer
      anchor="right"
      open={isCartDrawerOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
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
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Shopping Cart ({itemCount})
          </Typography>
          <IconButton onClick={handleClose} aria-label="close cart">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Cart Content - Empty for now */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">
            Cart drawer is open! Products will be displayed here.
          </Typography>
        </Box>
      </Box>
    </Drawer>
  )
}

export default CartDrawer

