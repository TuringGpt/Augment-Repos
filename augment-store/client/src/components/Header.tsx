import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Container,
  Tooltip,
} from '@mui/material'
import { ShoppingCart, Person, Favorite, Logout, Menu, Receipt } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { useCartStore } from '@store/cartStore'
import { useUIStore } from '@store/uiStore'
import SearchBar from '@components/common/SearchBar'
import SettingsMenu from '@components/SettingsMenu'
import { authService } from '@services/api/auth/authService'
import { useTranslation } from '@hooks/useTranslation'

const Header = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
          <Tooltip title={t('tooltip.menu')}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleSidebar}
              sx={{ mr: { xs: 0.5, sm: 1 } }}
              aria-label={t('tooltip.menu')}
            >
              <Menu />
            </IconButton>
          </Tooltip>

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
            {t('common.appName')}
          </Typography>

          {/* Search Bar - Hidden on mobile */}
          <Box sx={{ flexGrow: 1, mx: { xs: 1, md: 2 }, display: { xs: 'none', md: 'block' } }}>
            <SearchBar />
          </Box>

          {/* Spacer for mobile - pushes icons to the right */}
          <Box sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />

          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1, md: 2 }, alignItems: 'center' }}>
            {/* Cart Icon - Always Visible */}
            <Tooltip title={t('tooltip.cart')}>
              <IconButton color="inherit" onClick={handleCartClick} aria-label={t('tooltip.cart')}>
                <Badge badgeContent={cartItemCount} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Settings Menu - Always Visible */}
            <SettingsMenu />

            {/* Products Button - Hidden on mobile */}
            <Tooltip title={t('tooltip.products')}>
              <Button
                color="inherit"
                onClick={() => navigate('/products')}
                sx={{ display: { xs: 'none', md: 'inline-flex' } }}
              >
                {t('nav.products')}
              </Button>
            </Tooltip>

            {isAuthenticated && (
              <>
                {/* Wishlist - Hidden on mobile */}
                <Tooltip title={t('tooltip.wishlist')}>
                  <IconButton
                    color="inherit"
                    onClick={() => navigate('/wishlist')}
                    aria-label={t('tooltip.wishlist')}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    <Badge badgeContent={0} color="error">
                      <Favorite />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* Orders - Hidden on mobile */}
                <Tooltip title={t('tooltip.orders')}>
                  <IconButton
                    color="inherit"
                    onClick={() => navigate('/orders')}
                    aria-label={t('tooltip.orders')}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    <Receipt />
                  </IconButton>
                </Tooltip>

                {/* Support - Hidden on mobile */}
                <Tooltip title={t('tooltip.support')}>
                  <IconButton
                    color="inherit"
                    onClick={() => navigate('/support/tickets')}
                    aria-label={t('tooltip.support')}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    <HelpOutline />
                  </IconButton>
                </Tooltip>

                {/* Profile Icon - Hidden on mobile */}
                <Tooltip title={t('tooltip.profile')}>
                  <IconButton
                    color="inherit"
                    onClick={() => navigate('/profile')}
                    aria-label={t('tooltip.profile')}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    <Person />
                  </IconButton>
                </Tooltip>

                {/* User Name - Hidden on mobile */}
                <Typography
                  variant="body2"
                  sx={{ mr: { xs: 0, sm: 1 }, display: { xs: 'none', md: 'block' } }}
                >
                  {user?.firstName}
                </Typography>

                {/* Logout - Hidden on mobile */}
                <Tooltip title={t('tooltip.logout')}>
                  <IconButton
                    color="inherit"
                    onClick={handleLogout}
                    aria-label={t('tooltip.logout')}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    <Logout />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {!isAuthenticated && (
              <Tooltip title={t('tooltip.login')}>
                <Button
                  color="inherit"
                  onClick={() => navigate('/login')}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {t('nav.login')}
                </Button>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header
