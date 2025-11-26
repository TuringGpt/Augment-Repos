import { Container, Typography, Box, Paper, Grid, TextField, Button } from '@mui/material'
import { Email, Phone, LocationOn } from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'

const ContactPage = () => {
  const { t } = useTranslation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement contact form submission
    console.log('Contact form submitted')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        {t('contact.title')}
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              {t('contact.getInTouch')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('contact.description')}
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField fullWidth label={t('contact.name')} margin="normal" required />
              <TextField fullWidth label={t('contact.email')} type="email" margin="normal" required />
              <TextField fullWidth label={t('contact.subject')} margin="normal" required />
              <TextField fullWidth label={t('contact.message')} multiline rows={4} margin="normal" required />
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                {t('contact.sendMessage')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              {t('contact.contactInformation')}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2">{t('contact.email')}</Typography>
                  <Typography variant="body2">support@augmentstore.com</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Phone sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2">{t('contact.phone')}</Typography>
                  <Typography variant="body2">+1 (555) 123-4567</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2">{t('contact.address')}</Typography>
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
                {t('contact.businessHours')}
              </Typography>
              <Typography variant="body2">{t('contact.mondayFriday')}</Typography>
              <Typography variant="body2">{t('contact.saturday')}</Typography>
              <Typography variant="body2">{t('contact.sunday')}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ContactPage
