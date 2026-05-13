import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material'
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Inventory as ProductsIcon,
  People as UsersIcon,
  Category as CategoriesIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Store as BrandsIcon,
  Email as EmailIcon,
  ConfirmationNumber as TicketIcon,
  AttachMoney as CurrencyIcon,
  Newspaper as NewsletterIcon,
  AccountCircle as AccountsIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import Header from '@components/Header'
import Footer from '@components/Footer'
import Sidebar from '@components/Sidebar'
import BottomNavigation from '@components/BottomNavigation'
import PageTransition from '@components/PageTransition'
import CartDrawer from '@features/cart/components/CartDrawer'
import { NotificationDetailsDrawer } from '@features/notifications/components'
import { OrderDetailsDrawer } from '@features/admin-dashboard/components'
import { ROUTES } from '@constants/index'

const DRAWER_WIDTH = 260

interface NavItem {
  labelKey: 'admin.dashboardNav' | 'admin.orders' | 'admin.products' | 'admin.categories' | 'admin.brands' | 'admin.users' | 'admin.accounts' | 'admin.reports' | 'admin.contactMessages' | 'admin.tickets' | 'admin.newsletters' | 'admin.currency' | 'admin.settings'
  path: string
  icon: React.ReactNode
  activePaths?: string[] // Additional paths that should make this item active
}

const AdminLayout = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems: NavItem[] = [
    {
      labelKey: 'admin.dashboardNav',
      path: '/admin/dashboard',
      icon: <DashboardIcon />,
    },
    {
      labelKey: 'admin.orders',
      path: '/admin/orders',
      icon: <OrdersIcon />,
    },
    {
      labelKey: 'admin.products',
      path: '/admin/products',
      icon: <ProductsIcon />,
      activePaths: [ROUTES.ADMIN_PRODUCTS, ROUTES.ADMIN_PRODUCTS_ALL, ROUTES.ADMIN_PRODUCTS_STATISTICS],
    },
    {
      labelKey: 'admin.categories',
      path: '/admin/categories',
      icon: <CategoriesIcon />,
    },
    {
      labelKey: 'admin.brands',
      path: '/admin/brands',
      icon: <BrandsIcon />,
    },
    {
      labelKey: 'admin.users',
      path: '/admin/users',
      icon: <UsersIcon />,
    },
    {
      labelKey: 'admin.accounts',
      path: '/admin/accounts',
      icon: <AccountsIcon />,
    },
    {
      labelKey: 'admin.reports',
      path: '/admin/reports',
      icon: <ReportsIcon />,
    },
    {
      labelKey: 'admin.contactMessages',
      path: '/admin/contact-messages',
      icon: <EmailIcon />,
    },
    {
      labelKey: 'admin.tickets',
      path: '/admin/tickets',
      icon: <TicketIcon />,
    },
    {
      labelKey: 'admin.newsletters',
      path: ROUTES.ADMIN_NEWSLETTERS,
      icon: <NewsletterIcon />,
      activePaths: [ROUTES.ADMIN_NEWSLETTERS, ROUTES.ADMIN_NEWSLETTER_DETAIL],
    },
    {
      labelKey: 'admin.currency',
      path: '/admin/currency',
      icon: <CurrencyIcon />,
    },
    {
      labelKey: 'admin.settings',
      path: '/admin/settings',
      icon: <SettingsIcon />,
    },
  ]

  const isActive = (item: NavItem) => {
    // Check if current path matches the item's path
    if (location.pathname === item.path) return true

    // Check if current path matches any of the item's active paths
    if (item.activePaths) {
      return item.activePaths.some(activePath => {
        // For exact match
        if (location.pathname === activePath) return true

        // For dynamic routes (e.g., /admin/newsletters/:id)
        // Check if the current path starts with the base path
        if (activePath.includes('/:')) {
          const basePath = activePath.split('/:')[0]
          return location.pathname.startsWith(basePath + '/')
        }

        return false
      })
    }

    return false
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Sidebar />
      <Header />
      
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Side Navigation - Hidden on mobile, visible on desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              position: 'relative',
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('admin.panel')}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {t('admin.managementConsole')}
            </Typography>
          </Box>
          <Divider />
          <List sx={{ pt: 2 }}>
            {navItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isActive(item)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item) ? 'white' : 'text.secondary',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={t(item.labelKey)}
                    primaryTypographyProps={{
                      fontWeight: isActive(item) ? 600 : 400,
                      fontSize: '0.95rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            py: 3,
            pb: {
              xs: 'calc(70px + env(safe-area-inset-bottom))',
              md: 3,
            },
          }}
        >
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </Box>
      </Box>

      <Footer />
      <BottomNavigation />
      <CartDrawer />
      <NotificationDetailsDrawer />
      <OrderDetailsDrawer />
    </Box>
  )
}

export default AdminLayout

