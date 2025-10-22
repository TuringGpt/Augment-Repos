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
import SearchBar from '@components/common/SearchBar'

const Header = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { getItemCount } = useCartStore()
  const { toggleSidebar, toggleCartDrawer } = useUIStore()

  const cartItemCount = getItemCount()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCartClick = () => {
    toggleCartDrawer()
  }

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar sx={{ gap: 2 }}>
          {/* Burger Menu Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: 1 }}
            aria-label="menu"
          >
            <Menu />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => navigate('/')}
          >
            Augment Store
          </Typography>

          {/* Search Bar */}
          <Box sx={{ flexGrow: 1, mx: 2, display: { xs: 'none', md: 'block' } }}>
            <SearchBar />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Cart Icon - Always Visible */}
            <IconButton color="inherit" onClick={handleCartClick} aria-label="open cart">
              <Badge badgeContent={cartItemCount} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>

            <Button color="inherit" onClick={() => navigate('/products')}>
              Products
            </Button>

            {isAuthenticated && (
              <>
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/wishlist')}
                  aria-label="wishlist"
                >
                  <Badge badgeContent={0} color="error">
                    <Favorite />
                  </Badge>
                </IconButton>

                <IconButton
                  color="inherit"
                  onClick={() => navigate('/profile')}
                  aria-label="profile"
                >
                  <Person />
                </IconButton>

                <Typography variant="body2" sx={{ mr: 1 }}>
                  {user?.firstName}
                </Typography>

                <IconButton
                  color="inherit"
                  onClick={handleLogout}
                  title="Logout"
                  aria-label="logout"
                >
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
