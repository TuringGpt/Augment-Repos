import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import TopNavbar from '@components/TopNavbar'
import Header from '@components/Header'
import Footer from '@components/Footer'
import Sidebar from '@components/Sidebar'

const MainLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Sidebar />
      <TopNavbar />
      <Header />
      <Box component="main" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  )
}

export default MainLayout
