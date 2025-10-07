import { Box, Typography, Paper } from '@mui/material'

const LoginPage = () => {
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>
        <Typography color="text.secondary">
          Login form will be displayed here
        </Typography>
      </Box>
    </Paper>
  )
}

export default LoginPage

