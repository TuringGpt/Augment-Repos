import { Box, Container, Typography, Link, Grid } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { Colors } from '@config/colors'
import { useTranslation } from '@hooks/useTranslation'

const Footer = () => {
  const { t } = useTranslation()

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: Colors.neutral.gray200,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              {t('common.appName')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('footer.tagline')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              {t('footer.quickLinks')}
            </Typography>
            <Link component={RouterLink} to="/products" color="inherit" display="block">
              {t('nav.products')}
            </Link>
            <Link component={RouterLink} to="/about" color="inherit" display="block">
              {t('footer.aboutUs')}
            </Link>
            <Link component={RouterLink} to="/contact" color="inherit" display="block">
              {t('footer.contact')}
            </Link>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              {t('footer.customerService')}
            </Typography>
            <Link component={RouterLink} to="/help" color="inherit" display="block">
              {t('footer.helpCenter')}
            </Link>
            <Link component={RouterLink} to="/returns" color="inherit" display="block">
              {t('footer.returns')}
            </Link>
            <Link component={RouterLink} to="/shipping" color="inherit" display="block">
              {t('footer.shippingInfo')}
            </Link>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          © {new Date().getFullYear()} {t('common.appName')}. {t('footer.allRightsReserved')}.
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
