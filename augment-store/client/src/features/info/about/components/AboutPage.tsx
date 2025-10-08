import { Container, Typography, Box, Paper } from '@mui/material'

const AboutPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          About Augment Store
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Our Story
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to Augment Store, your trusted destination for quality products and exceptional
            service. We are committed to providing our customers with the best shopping experience
            possible.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Our Mission
          </Typography>
          <Typography variant="body1" paragraph>
            Our mission is to deliver high-quality products at competitive prices while maintaining
            the highest standards of customer service. We believe in building lasting relationships
            with our customers through trust, transparency, and excellence.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Why Choose Us
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>Wide selection of quality products</li>
              <li>Competitive pricing</li>
              <li>Fast and reliable shipping</li>
              <li>Excellent customer support</li>
              <li>Secure payment processing</li>
              <li>Easy returns and exchanges</li>
            </ul>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default AboutPage
