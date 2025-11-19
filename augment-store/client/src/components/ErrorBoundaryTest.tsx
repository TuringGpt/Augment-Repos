import { useState } from 'react'
import { Box, Button, Container, Typography, Paper } from '@mui/material'
import BugReportIcon from '@mui/icons-material/BugReport'

/**
 * Test component to demonstrate Error Boundary functionality
 * This component can be temporarily added to any page to test error handling
 * 
 * Usage:
 * Import and add <ErrorBoundaryTest /> to any page
 * Click the "Trigger Error" button to test the Error Boundary
 */
const ErrorBoundaryTest = () => {
  const [shouldThrowError, setShouldThrowError] = useState(false)

  if (shouldThrowError) {
    // This will trigger the Error Boundary
    throw new Error('Test error: This is a simulated crash to test the Error Boundary!')
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: 'warning.main',
        }}
      >
        <BugReportIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Error Boundary Test Component
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Click the button below to simulate a component crash and test the Error Boundary.
        </Typography>
        
        <Button
          variant="contained"
          color="warning"
          onClick={() => setShouldThrowError(true)}
          startIcon={<BugReportIcon />}
        >
          Trigger Error
        </Button>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Note: Remove this component before deploying to production
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default ErrorBoundaryTest

