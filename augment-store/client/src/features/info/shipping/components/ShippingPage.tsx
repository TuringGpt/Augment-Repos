import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
} from '@mui/material'
import {
  LocalShipping as LocalShippingIcon,
  Public as PublicIcon,
  TrackChanges as TrackChangesIcon,
  Block as BlockIcon,
  ReportProblem as ReportProblemIcon,
  HelpOutline as HelpOutlineIcon,
  Speed as SpeedIcon,
  Flight as FlightIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { CONTACT_INFO } from '@constants/index'

const ShippingPage = () => {
  const { t } = useTranslation()

  const domesticRates = [
    {
      method: t('shipping.methods.standard'),
      time: t('shipping.deliveryTimes.standard'),
      cost: '$5.99',
      icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
      color: 'primary.main',
    },
    {
      method: t('shipping.methods.express'),
      time: t('shipping.deliveryTimes.express'),
      cost: '$12.99',
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      color: 'secondary.main',
    },
    {
      method: t('shipping.methods.overnight'),
      time: t('shipping.deliveryTimes.overnight'),
      cost: '$24.99',
      icon: <FlightIcon sx={{ fontSize: 40 }} />,
      color: 'error.main',
    },
  ]

  const internationalRates = [
    { region: t('shipping.regions.canada'), time: t('shipping.deliveryTimes.canada'), cost: '$15.99' },
    { region: t('shipping.regions.europe'), time: t('shipping.deliveryTimes.europe'), cost: '$29.99' },
    { region: t('shipping.regions.asia'), time: t('shipping.deliveryTimes.asia'), cost: '$29.99' },
    { region: t('shipping.regions.australia'), time: t('shipping.deliveryTimes.australia'), cost: '$34.99' },
    { region: t('shipping.regions.restOfWorld'), time: t('shipping.deliveryTimes.restOfWorld'), cost: '$39.99' },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
          {t('shipping.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
          {t('shipping.intro')}
        </Typography>
      </Box>

      {/* Domestic Shipping Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <LocalShippingIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={600}>
            {t('shipping.domesticShipping.title')}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {domesticRates.map((rate) => (
            <Grid item xs={12} md={4} key={rate.method}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box sx={{ color: rate.color, mb: 2 }}>{rate.icon}</Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {rate.method}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <AccessTimeIcon color="action" fontSize="small" />
                    <Typography variant="body1" color="text.secondary">
                      {rate.time}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <AttachMoneyIcon color="success" fontSize="small" />
                    <Typography variant="h4" fontWeight={700} color="primary">
                      {rate.cost}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Alert severity="info" icon={<LocalShippingIcon />} sx={{ mt: 3 }}>
          <Typography variant="body2">{t('shipping.domesticShipping.freeShippingNote')}</Typography>
        </Alert>
      </Box>

      {/* International Shipping Section */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <PublicIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={600}>
            {t('shipping.internationalShipping.title')}
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ overflow: 'hidden' }}>
          {internationalRates.map((rate, index) => (
            <Box
              key={rate.region}
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: index < internationalRates.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  {rate.region}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="action" fontSize="small" />
                <Typography variant="body1" color="text.secondary">
                  {rate.time}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'right' }}>
                <Chip
                  label={`From ${rate.cost}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '1rem', px: 1 }}
                />
              </Box>
            </Box>
          ))}
        </Paper>

        <Alert severity="warning" icon={<PublicIcon />} sx={{ mt: 3 }}>
          <Typography variant="body2">{t('shipping.internationalShipping.customsNote')}</Typography>
        </Alert>
      </Box>

      {/* Additional Information Grid */}
      <Grid container spacing={4}>
        {/* Order Tracking */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <TrackChangesIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h5" fontWeight={600}>
                {t('shipping.orderTracking.title')}
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              {t('shipping.orderTracking.paragraph1')}
            </Typography>
            <Typography variant="body1">{t('shipping.orderTracking.paragraph2')}</Typography>
          </Paper>
        </Grid>

        {/* Shipping Restrictions */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <BlockIcon color="error" sx={{ fontSize: 32 }} />
              <Typography variant="h5" fontWeight={600}>
                {t('shipping.restrictions.title')}
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              {t('shipping.restrictions.paragraph1')}
            </Typography>
            <Typography variant="body1">{t('shipping.restrictions.paragraph2')}</Typography>
          </Paper>
        </Grid>

        {/* Damaged or Lost Packages */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4, bgcolor: 'warning.light' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ReportProblemIcon sx={{ fontSize: 32, color: 'warning.dark' }} />
              <Typography variant="h5" fontWeight={600} color="warning.dark">
                {t('shipping.damagedOrLost.title')}
              </Typography>
            </Box>
            <Typography variant="body1" color="warning.dark">
              {t('shipping.damagedOrLost.paragraph', { supportEmail: CONTACT_INFO.SUPPORT_EMAIL })}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Contact Section */}
      <Paper
        elevation={3}
        sx={{
          mt: 6,
          p: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h5" fontWeight={600} gutterBottom>
          {t('shipping.questionsAboutShipping.title')}
        </Typography>
        <Typography variant="body1">
          {t('shipping.questionsAboutShipping.paragraph', {
            supportEmail: CONTACT_INFO.SUPPORT_EMAIL,
            supportPhone: CONTACT_INFO.SUPPORT_PHONE,
          })}
        </Typography>
      </Paper>
    </Container>
  )
}

export default ShippingPage
