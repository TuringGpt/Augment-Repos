import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import Header from '@components/Header'
import Footer from '@components/Footer'
import Sidebar from '@components/Sidebar'
import CartDrawer from '@features/cart/components/CartDrawer'
import { useCartSync } from '@features/cart/hooks/useCartSync'

const MainLayout = () => {
  const { refetchCart } = useCartSync()

  // Sync cart from API on mount when user is authenticated
  useEffect(() => {
    refetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

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
