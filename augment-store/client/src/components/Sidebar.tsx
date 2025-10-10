import { useEffect, useRef } from 'react'
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
} from '@mui/material'
import {
  Category,
  Devices,
  Checkroom,
  Home,
  SportsEsports,
  MenuBook,
  FitnessCenter,
  Pets,
  ExpandLess,
  ExpandMore,
  Close,
} from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@store/uiStore'

interface Category {
  id: string
  name: string
  icon: JSX.Element
  subcategories?: { id: string; name: string }[]
}

const categories: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: <Devices />,
    subcategories: [
      { id: 'phones', name: 'Phones & Tablets' },
      { id: 'computers', name: 'Computers' },
      { id: 'audio', name: 'Audio & Headphones' },
      { id: 'cameras', name: 'Cameras' },
      { id: 'accessories', name: 'Accessories' },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: <Checkroom />,
    subcategories: [
      { id: 'mens', name: "Men's Clothing" },
      { id: 'womens', name: "Women's Clothing" },
      { id: 'shoes', name: 'Shoes' },
      { id: 'accessories', name: 'Accessories' },
      { id: 'jewelry', name: 'Jewelry' },
    ],
  },
  {
    id: 'home',
    name: 'Home & Garden',
    icon: <Home />,
    subcategories: [
      { id: 'furniture', name: 'Furniture' },
      { id: 'decor', name: 'Home Decor' },
      { id: 'kitchen', name: 'Kitchen & Dining' },
      { id: 'bedding', name: 'Bedding' },
      { id: 'garden', name: 'Garden & Outdoor' },
    ],
  },
  {
    id: 'sports',
    name: 'Sports & Outdoors',
    icon: <FitnessCenter />,
    subcategories: [
      { id: 'fitness', name: 'Fitness Equipment' },
      { id: 'outdoor', name: 'Outdoor Recreation' },
      { id: 'cycling', name: 'Cycling' },
      { id: 'camping', name: 'Camping & Hiking' },
      { id: 'water', name: 'Water Sports' },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: <SportsEsports />,
    subcategories: [
      { id: 'consoles', name: 'Consoles' },
      { id: 'games', name: 'Video Games' },
      { id: 'accessories', name: 'Gaming Accessories' },
      { id: 'pc', name: 'PC Gaming' },
      { id: 'vr', name: 'VR & AR' },
    ],
  },
  {
    id: 'books',
    name: 'Books & Media',
    icon: <MenuBook />,
    subcategories: [
      { id: 'books', name: 'Books' },
      { id: 'ebooks', name: 'E-Books' },
      { id: 'audiobooks', name: 'Audiobooks' },
      { id: 'movies', name: 'Movies & TV' },
      { id: 'music', name: 'Music' },
    ],
  },
  {
    id: 'pets',
    name: 'Pet Supplies',
    icon: <Pets />,
    subcategories: [
      { id: 'dog', name: 'Dog Supplies' },
      { id: 'cat', name: 'Cat Supplies' },
      { id: 'fish', name: 'Fish & Aquatic' },
      { id: 'bird', name: 'Bird Supplies' },
      { id: 'small', name: 'Small Animals' },
    ],
  },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { isSidebarOpen, closeSidebar } = useUIStore()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const handleCategoryClick = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null)
    } else {
      setExpandedCategory(categoryId)
    }
  }

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    navigate(`/products?category=${categoryId}&subcategory=${subcategoryId}`)
    closeSidebar()
  }

  const handleAllProductsClick = () => {
    navigate('/products')
    closeSidebar()
  }

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        closeSidebar()
      }
    }

    if (isSidebarOpen) {
      // Add a small delay to prevent immediate closing when opening
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)

      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isSidebarOpen, closeSidebar])

  return (
    <Drawer
      anchor="left"
      open={isSidebarOpen}
      onClose={closeSidebar}
      sx={{
        '& .MuiDrawer-paper': {
          width: 320,
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        },
      }}
      SlideProps={{
        ref: sidebarRef,
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
            <Category sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              Categories
            </Typography>
          </Box>
          <IconButton onClick={closeSidebar} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

        {/* All Products */}
        <List sx={{ pt: 0 }}>
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
                <Category />
              </ListItemIcon>
              <ListItemText
                primary="All Products"
                primaryTypographyProps={{ fontWeight: 'medium' }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

        {/* Categories List */}
        <List sx={{ flex: 1, overflow: 'auto', pt: 1 }}>
          {categories.map((category) => (
            <Box key={category.id}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleCategoryClick(category.id)}
                  sx={{
                    py: 1.5,
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>{category.icon}</ListItemIcon>
                  <ListItemText
                    primary={category.name}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                  {category.subcategories &&
                    (expandedCategory === category.id ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
              </ListItem>

              {/* Subcategories */}
              {category.subcategories && (
                <Collapse in={expandedCategory === category.id} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {category.subcategories.map((subcategory) => (
                      <ListItemButton
                        key={subcategory.id}
                        onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
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
          ))}
        </List>
      </Box>
    </Drawer>
  )
}

export default Sidebar
