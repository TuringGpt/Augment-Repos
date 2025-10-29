import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import Header from '@components/Header'
import Footer from '@components/Footer'
import Sidebar from '@components/Sidebar'
import CartDrawer from '@features/cart/components/CartDrawer'
import { useCartSync } from '@features/cart/hooks/useCartSync'

const MainLayout = () => {
  // Sync cart from API when user is authenticated
  useCartSync()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Sidebar />
      <Header />
      <Box component="main" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Box>
      <Footer />
      <CartDrawer />
    </Box>
  )
}

export default MainLayout
