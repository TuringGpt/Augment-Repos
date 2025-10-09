import { Container, Typography, Box } from '@mui/material'

const HomePage = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h2" gutterBottom>
          Welcome to Augment Store
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Your one-stop e-commerce solution
        </Typography>
      </Box>
    </Container>
  )
}

export default HomePage
