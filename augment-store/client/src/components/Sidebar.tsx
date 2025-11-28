import { useState, useEffect } from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Collapse,
  IconButton,
  CircularProgress,
} from '@mui/material'
import {
  Category as CategoryIcon,
  ExpandLess,
  ExpandMore,
  Close,
  FolderOpen,
  ShoppingBag,
  Favorite,
  Person,
  Logout,
  Login,
  Receipt,
  HelpOutline,
  Notifications,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@store/uiStore'
import { useAuthStore } from '@store/authStore'
import { productService } from '@services/api/products/productService'
import { buildCategoryTree, categoryNameToSlug } from '@utils/categoryUtils'
import { authService } from '@services/api/auth/authService'
import type { CategoryWithChildren } from '@features/products/types'
import { ROUTES } from '@constants/index'

const Sidebar = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isSidebarOpen, closeSidebar } = useUIStore()
  const { isAuthenticated, user } = useAuthStore()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        const flatCategories = await productService.getCategories()
        const hierarchicalCategories = buildCategoryTree(flatCategories)
        setCategories(hierarchicalCategories)
      } catch (error) {
        console.error('Failed to load categories:', error)
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryClick = (categoryId: string, categoryName: string, hasChildren: boolean) => {
    if (hasChildren) {
      // Toggle expansion for categories with children
      if (expandedCategory === categoryId) {
        setExpandedCategory(null)
      } else {
        setExpandedCategory(categoryId)
      }
    } else {
      // Navigate directly for categories without children
      // TEMPORARY: Generate slug from name until backend exposes slug field
      const slug = categoryNameToSlug(categoryName)
      navigate(`/products?category=${encodeURIComponent(slug)}`)
      closeSidebar()
    }
  }

  const handleSubcategoryClick = (categoryName: string) => {
    // TEMPORARY: Generate slug from name until backend exposes slug field
    const slug = categoryNameToSlug(categoryName)
    navigate(`/products?category=${encodeURIComponent(slug)}`)
    closeSidebar()
  }

  const handleAllProductsClick = () => {
    navigate(ROUTES.PRODUCTS)
    closeSidebar()
  }

  const handleWishlistClick = () => {
    navigate(ROUTES.WISHLIST)
    closeSidebar()
  }

  const handleOrdersClick = () => {
    navigate(ROUTES.ORDERS)
    closeSidebar()
  }

  const handleNotificationsClick = () => {
    navigate(ROUTES.NOTIFICATIONS)
    closeSidebar()
  }

  const handleProfileClick = () => {
    navigate(ROUTES.PROFILE)
    closeSidebar()
  }

  const handleSupportClick = () => {
    navigate(ROUTES.SUPPORT_TICKETS)
    closeSidebar()
  }

  const handleLoginClick = () => {
    navigate(ROUTES.LOGIN)
    closeSidebar()
  }

  const handleLogout = async () => {
    await authService.logout()
    closeSidebar()
    navigate(ROUTES.LOGIN)
  }

  return (
    <Drawer
      anchor="left"
      open={isSidebarOpen}
      onClose={closeSidebar}
      variant="temporary"
      ModalProps={{
        keepMounted: true, // Better mobile performance
        BackdropProps: {
          transitionDuration: {
            enter: 350,
            exit: 250,
          },
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}
      SlideProps={{
        direction: 'right',
        easing: {
          enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
          exit: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
      transitionDuration={{
        enter: 350,
        exit: 250,
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: 320,
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          willChange: 'transform',
          transform: 'translateZ(0)', // Force GPU acceleration
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
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              {t('sidebar.menu')}
            </Typography>
          </Box>
          <IconButton onClick={closeSidebar} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

        {/* Navigation Menu - Only visible on mobile/tablet, hidden on desktop */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <List sx={{ pt: 0 }}>
            {/* Products */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleAllProductsClick}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  <ShoppingBag />
                </ListItemIcon>
                <ListItemText
                  primary={t('nav.products')}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItemButton>
            </ListItem>

            {isAuthenticated && (
              <>
                {/* Wishlist */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleWishlistClick}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        background: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      <Favorite />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('nav.wishlist')}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItemButton>
                </ListItem>

                {/* Orders */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleOrdersClick}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        background: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      <Receipt />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('nav.orders')}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItemButton>
                </ListItem>

                {/* Notifications */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleNotificationsClick}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        background: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      <Notifications />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('notifications.title')}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItemButton>
                </ListItem>

                {/* Profile */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleProfileClick}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        background: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      <Person />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        user?.firstName
                          ? t('sidebar.profileWithName', { name: user.firstName })
                          : t('nav.profile')
                      }
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItemButton>
                </ListItem>

                {/* Support */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleSupportClick}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        background: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      <HelpOutline />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('nav.support')}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItemButton>
                </ListItem>

                {/* Logout */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleLogout}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        background: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      <Logout />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('nav.logout')}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItemButton>
                </ListItem>
              </>
            )}

            {!isAuthenticated && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleLoginClick}
                  sx={{
                    py: 1.5,
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                    <Login />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('nav.login')}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        </Box>

        {/* Categories Section Header */}
        <Box sx={{ px: 2, py: 1.5, background: 'rgba(0,0,0,0.05)' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ opacity: 0.9 }}>
            {t('sidebar.categories')}
          </Typography>
        </Box>

        {/* Categories List */}
        <List sx={{ flex: 1, overflow: 'auto', pt: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: 'white' }} size={40} />
            </Box>
          ) : categories.length === 0 ? (
            <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {t('sidebar.noCategoriesAvailable')}
              </Typography>
            </Box>
          ) : (
            categories.map((category) => {
              const hasChildren = !!(category.children && category.children.length > 0)

              return (
                <Box key={category.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleCategoryClick(category.id, category.name, hasChildren)}
                      sx={{
                        py: 1.5,
                        '&:hover': {
                          background: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                        <FolderOpen />
                      </ListItemIcon>
                      <ListItemText
                        primary={category.name}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                      {hasChildren &&
                        (expandedCategory === category.id ? <ExpandLess /> : <ExpandMore />)}
                    </ListItemButton>
                  </ListItem>

                  {/* Subcategories */}
                  {hasChildren && (
                    <Collapse in={expandedCategory === category.id} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {category.children!.map((subcategory) => (
                          <ListItemButton
                            key={subcategory.id}
                            onClick={() => handleSubcategoryClick(subcategory.name)}
                            sx={{
                              pl: 7,
                              py: 1,
                              background: 'rgba(0,0,0,0.1)',
                              '&:hover': {
                                background: 'rgba(255,255,255,0.15)',
                              },
                            }}
                          >
                            <ListItemText
                              primary={subcategory.name}
                              primaryTypographyProps={{ fontSize: '0.9rem' }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </Box>
              )
            })
          )}
        </List>
      </Box>
    </Drawer>
  )
}

export default Sidebar
