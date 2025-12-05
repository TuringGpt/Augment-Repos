import { useState } from 'react'
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
  Menu as MuiMenu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material'
import { ShoppingCart, Person, Favorite, Logout, Menu, Receipt, Email } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { useCartStore } from '@store/cartStore'
import { useUIStore } from '@store/uiStore'
import SearchBar from '@components/common/SearchBar'
import SettingsMenu from '@components/SettingsMenu'
import NotificationBell from '@features/notifications/components/NotificationBell'
import { authService } from '@services/api/auth/authService'
import { useTranslation } from '@hooks/useTranslation'

const Header = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuthStore()
  const { getItemCount } = useCartStore()
  const { toggleSidebar, toggleCartDrawer } = useUIStore()
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null)
  const profileMenuOpen = Boolean(profileAnchorEl)

  const cartItemCount = getItemCount()

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null)
  }

  const handleLogout = async () => {
    handleProfileMenuClose()
    await authService.logout()
    navigate('/login')
  }

  const handleCartClick = () => {
    toggleCartDrawer()
  }

  const handleProfileNavigation = (path: string) => {
    handleProfileMenuClose()
    navigate(path)
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

            {/* Notification Bell - Only visible when authenticated */}
            <NotificationBell />

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
                {/* Profile Dropdown - Hidden on mobile */}
                <Tooltip title={t('tooltip.profile')}>
                  <IconButton
                    id="profile-button"
                    color="inherit"
                    onClick={handleProfileMenuOpen}
                    aria-label={t('tooltip.profile')}
                    aria-controls={profileMenuOpen ? 'profile-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={profileMenuOpen ? 'true' : undefined}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'secondary.main',
                        fontSize: '0.875rem',
                      }}
                    >
                      {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                {/* Profile Dropdown Menu */}
                <MuiMenu
                  id="profile-menu"
                  anchorEl={profileAnchorEl}
                  open={profileMenuOpen}
                  onClose={handleProfileMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'profile-button',
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      minWidth: 200,
                    },
                  }}
                >
                  {/* User Info Header */}
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                  <Divider />

                  {/* Profile */}
                  <MenuItem onClick={() => handleProfileNavigation('/profile')}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('nav.profile')}</ListItemText>
                  </MenuItem>

                  {/* Orders */}
                  <MenuItem onClick={() => handleProfileNavigation('/orders')}>
                    <ListItemIcon>
                      <Receipt fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('nav.orders')}</ListItemText>
                  </MenuItem>

                  {/* Wishlist */}
                  <MenuItem onClick={() => handleProfileNavigation('/wishlist')}>
                    <ListItemIcon>
                      <Badge badgeContent={0} color="error">
                        <Favorite fontSize="small" />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText>{t('nav.wishlist')}</ListItemText>
                  </MenuItem>

                  {/* Newsletter */}
                  <MenuItem onClick={() => handleProfileNavigation('/newsletters')}>
                    <ListItemIcon>
                      <Email fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('footer.newsletter')}</ListItemText>
                  </MenuItem>

                  <Divider />

                  {/* Logout */}
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('nav.logout')}</ListItemText>
                  </MenuItem>
                </MuiMenu>
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
