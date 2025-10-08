import { Container, Typography, Box, Paper, Grid, TextField, Button } from '@mui/material'
import { Email, Phone, LocationOn } from '@mui/icons-material'

const ContactPage = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement contact form submission
    console.log('Contact form submitted')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Contact Us
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Get in Touch
            </Typography>
            <Typography variant="body1" paragraph>
              Have a question or need assistance? We're here to help! Fill out the form and we'll
              get back to you as soon as possible.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField fullWidth label="Name" margin="normal" required />
              <TextField fullWidth label="Email" type="email" margin="normal" required />
              <TextField fullWidth label="Subject" margin="normal" required />
              <TextField fullWidth label="Message" multiline rows={4} margin="normal" required />
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                Send Message
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Contact Information
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body2">support@augmentstore.com</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Phone sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography variant="body2">+1 (555) 123-4567</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2">Address</Typography>
                  <Typography variant="body2">
                    123 Commerce Street
                    <br />
                    San Francisco, CA 94102
                    <br />
                    United States
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Business Hours
              </Typography>
              <Typography variant="body2">Monday - Friday: 9:00 AM - 6:00 PM PST</Typography>
              <Typography variant="body2">Saturday: 10:00 AM - 4:00 PM PST</Typography>
              <Typography variant="body2">Sunday: Closed</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ContactPage
