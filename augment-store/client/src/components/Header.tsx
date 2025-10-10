import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Container,
} from '@mui/material'
import { ShoppingCart, Person, Favorite, Logout, Menu } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { useCartStore } from '@store/cartStore'
import { useUIStore } from '@store/uiStore'

const Header = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { getItemCount } = useCartStore()
  const { toggleSidebar } = useUIStore()

  const cartItemCount = getItemCount()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar>
          {/* Burger Menu Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
            aria-label="menu"
          >
            <Menu />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Augment Store
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button color="inherit" onClick={() => navigate('/products')}>
              Products
            </Button>

            {isAuthenticated && (
              <>
                <IconButton color="inherit" onClick={() => navigate('/wishlist')}>
                  <Badge badgeContent={0} color="error">
                    <Favorite />
                  </Badge>
                </IconButton>

                <IconButton color="inherit" onClick={() => navigate('/cart')}>
                  <Badge badgeContent={cartItemCount} color="error">
                    <ShoppingCart />
                  </Badge>
                </IconButton>

                <IconButton color="inherit" onClick={() => navigate('/profile')}>
                  <Person />
                </IconButton>

                <Typography variant="body2" sx={{ mr: 1 }}>
                  {user?.firstName}
                </Typography>

                <IconButton color="inherit" onClick={handleLogout} title="Logout">
                  <Logout />
                </IconButton>
              </>
            )}

            {!isAuthenticated && (
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header
