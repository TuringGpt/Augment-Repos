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
import { ShoppingCart, Person, Favorite, Logout, Menu, Receipt } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { useCartStore } from '@store/cartStore'
import { useUIStore } from '@store/uiStore'
import SearchBar from '@components/common/SearchBar'
import ThemeToggle from '@components/ThemeToggle'
import LanguageSwitcher from '@components/LanguageSwitcher'
import { authService } from '@services/api/auth/authService'

const Header = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const { getItemCount } = useCartStore()
  const { toggleSidebar, toggleCartDrawer } = useUIStore()

  const cartItemCount = getItemCount()

  const handleLogout = async () => {
    await authService.logout()
    navigate('/login')
  }

  const handleCartClick = () => {
    toggleCartDrawer()
  }

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar sx={{ gap: { xs: 0.5, sm: 1, md: 2 }, px: { xs: 0.5, sm: 2 } }}>
          {/* Burger Menu Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: { xs: 0.5, sm: 1 } }}
            aria-label="menu"
          >
            <Menu />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              flexShrink: 0,
            }}
            onClick={() => navigate('/')}
          >
            Augment Store
          </Typography>

          {/* Search Bar - Hidden on mobile */}
          <Box sx={{ flexGrow: 1, mx: { xs: 1, md: 2 }, display: { xs: 'none', md: 'block' } }}>
            <SearchBar />
          </Box>

          {/* Spacer for mobile - pushes icons to the right */}
          <Box sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />

          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1, md: 2 }, alignItems: 'center' }}>
            {/* Cart Icon - Always Visible */}
            <IconButton color="inherit" onClick={handleCartClick} aria-label="open cart">
              <Badge badgeContent={cartItemCount} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>

            {/* Theme Toggle - Always Visible */}
            <ThemeToggle />

            {/* Language Switcher - Always Visible */}
            <LanguageSwitcher />

            {/* Products Button - Hidden on mobile */}
            <Button
              color="inherit"
              onClick={() => navigate('/products')}
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              Products
            </Button>

            {isAuthenticated && (
              <>
                {/* Wishlist - Hidden on mobile */}
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/wishlist')}
                  aria-label="wishlist"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  <Badge badgeContent={0} color="error">
                    <Favorite />
                  </Badge>
                </IconButton>

                {/* Orders - Hidden on mobile */}
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/orders')}
                  aria-label="orders"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  <Receipt />
                </IconButton>

                {/* Profile Icon - Hidden on mobile */}
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/profile')}
                  aria-label="profile"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  <Person />
                </IconButton>

                {/* User Name - Hidden on mobile */}
                <Typography
                  variant="body2"
                  sx={{ mr: { xs: 0, sm: 1 }, display: { xs: 'none', md: 'block' } }}
                >
                  {user?.firstName}
                </Typography>

                {/* Logout - Hidden on mobile */}
                <IconButton
                  color="inherit"
                  onClick={handleLogout}
                  title="Logout"
                  aria-label="logout"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  <Logout />
                </IconButton>
              </>
            )}

            {!isAuthenticated && (
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
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
