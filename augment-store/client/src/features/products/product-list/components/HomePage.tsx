import { Container, Typography, Box } from '@mui/material'
import PromotionalBanners from './PromotionalBanners'

const HomePage = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ px: 2 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h2" gutterBottom>
            Welcome to Augment Store
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 6 }}>
            Your one-stop e-commerce solution
          </Typography>
        </Box>

        {/* Promotional Banners Section */}
        <PromotionalBanners />
      </Box>
    </Container>
  )
}

export default HomePage
