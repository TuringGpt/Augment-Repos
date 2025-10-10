import { Box, Container, Typography, Divider } from '@mui/material'
import { LocalShipping, Phone, CreditCard, LocalOffer } from '@mui/icons-material'

const TopNavbar = () => {
  // BUG #1: Hardcoded phone number - should be in config/constants
  const phoneNumber = '1-800-123-4567'
  const minOrderAmount = 50

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        color: 'white',
        py: 0.75,
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Free Delivery */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShipping sx={{ fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Free Delivery on Orders Over ${minOrderAmount}
            </Typography>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              display: { xs: 'none', sm: 'block' },
            }}
          />

          {/* Contact Number */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone sx={{ fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Call Us: {phoneNumber}
            </Typography>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              display: { xs: 'none', sm: 'block' },
            }}
          />

          {/* Payment Methods */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCard sx={{ fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Secure Payments
            </Typography>
          </Box>

          {/* BUG #2: Unused import - LocalOffer icon is imported but never used */}
        </Box>
      </Container>
    </Box>
  )
}

export default TopNavbar
