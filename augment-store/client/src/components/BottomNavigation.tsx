import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material'
import { Home, ShoppingBag, Search, Favorite, Person } from '@mui/icons-material'
import { useAuthStore } from '@store/authStore'

// Helper function to get initial tab value from pathname
const getTabFromPath = (pathname: string): number => {
  // Check for auth routes first (deselect all tabs)
  if (pathname === '/login' || pathname === '/register') {
    return -1
  }
  // Check for nested routes using prefix matching (order matters - most specific first)
  if (pathname.startsWith('/wishlist')) {
    return 3
  }
  if (pathname.startsWith('/profile')) {
    return 4
  }
  if (pathname.startsWith('/search')) {
    return 2
  }
  if (pathname.startsWith('/products')) {
    return 1
  }
  if (pathname === '/') {
    return 0
  }
  // For any other route, deselect all tabs
  return -1
}

const BottomNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const [value, setValue] = useState(() => getTabFromPath(location.pathname))

  // Update active tab based on current route
  useEffect(() => {
    setValue(getTabFromPath(location.pathname))
  }, [location.pathname])

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)

    switch (newValue) {
      case 0:
        navigate('/')
        break
      case 1:
        navigate('/products')
        break
      case 2:
        navigate('/search')
        break
      case 3:
        if (isAuthenticated) {
          navigate('/wishlist')
        } else {
          navigate('/login')
        }
        break
      case 4:
        if (isAuthenticated) {
          navigate('/profile')
        } else {
          navigate('/login')
        }
        break
    }
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', md: 'none' }, // Only show on mobile
        zIndex: 1100,
      }}
      elevation={8}
    >
      <MuiBottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&:active': {
              transform: 'scale(0.95)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '0',
              height: '0',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.1)',
              transform: 'translate(-50%, -50%)',
              transition: 'width 0.6s, height 0.6s',
            },
            '&:active::after': {
              width: '100px',
              height: '100px',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            marginTop: '4px',
            transition: 'all 0.3s ease',
          },
          '& .MuiSvgIcon-root': {
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '& .Mui-selected': {
            color: 'primary.main',
            '& .MuiSvgIcon-root': {
              transform: 'scale(1.2)',
            },
            '& .MuiBottomNavigationAction-label': {
              fontWeight: 600,
            },
          },
        }}
      >
        <BottomNavigationAction label="Home" icon={<Home />} />
        <BottomNavigationAction label="Products" icon={<ShoppingBag />} />
        <BottomNavigationAction label="Search" icon={<Search />} />
        <BottomNavigationAction label="Wishlist" icon={<Favorite />} />
        <BottomNavigationAction label="Profile" icon={<Person />} />
      </MuiBottomNavigation>
    </Paper>
  )
}

export default BottomNavigation
