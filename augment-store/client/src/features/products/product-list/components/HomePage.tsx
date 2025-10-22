import { Container, Box } from '@mui/material'
import PromotionalBanners from './PromotionalBanners'

const HomePage = () => {
  return (
    <Container maxWidth="xl" disableGutters>
      <Box sx={{ py: 4 }}>
        {/* Promotional Banners Section */}
        <PromotionalBanners />
      </Box>
    </Container>
  )
}

export default HomePage
