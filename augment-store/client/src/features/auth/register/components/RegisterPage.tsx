import { Box, Typography, Paper } from '@mui/material'

const RegisterPage = () => {
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Register
        </Typography>
        <Typography color="text.secondary">
          Registration form will be displayed here
        </Typography>
      </Box>
    </Paper>
  )
}

export default RegisterPage

