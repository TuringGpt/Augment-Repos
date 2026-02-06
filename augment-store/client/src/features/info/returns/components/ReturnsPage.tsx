import { Container, Typography, Box, Paper, Alert } from '@mui/material'
import { useTranslation } from '@hooks/useTranslation'
import { CONTACT_INFO } from '@constants/index'

const ReturnsPage = () => {
  const { t } = useTranslation()

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('returns.title')}
        </Typography>

        <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
          {t('returns.satisfactionAlert')}
        </Alert>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('returns.returnPolicy.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('returns.returnPolicy.intro')}
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>{t('returns.returnPolicy.conditions.unused')}</li>
              <li>{t('returns.returnPolicy.conditions.originalPackaging')}</li>
              <li>{t('returns.returnPolicy.conditions.receipt')}</li>
            </ul>
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('returns.nonReturnableItems.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('returns.nonReturnableItems.intro')}
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>{t('returns.nonReturnableItems.items.perishable')}</li>
              <li>{t('returns.nonReturnableItems.items.custom')}</li>
              <li>{t('returns.nonReturnableItems.items.personalCare')}</li>
              <li>{t('returns.nonReturnableItems.items.hazardous')}</li>
              <li>{t('returns.nonReturnableItems.items.giftCards')}</li>
              <li>{t('returns.nonReturnableItems.items.digital')}</li>
            </ul>
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('returns.howToReturn.title')}
          </Typography>
          <Typography variant="body1" component="div">
            <ol>
              <li>{t('returns.howToReturn.steps.step1')}</li>
              <li>{t('returns.howToReturn.steps.step2')}</li>
              <li>{t('returns.howToReturn.steps.step3')}</li>
              <li>{t('returns.howToReturn.steps.step4')}</li>
              <li>{t('returns.howToReturn.steps.step5')}</li>
            </ol>
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('returns.refunds.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('returns.refunds.inspection')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('returns.refunds.processing')}
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('returns.exchanges.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('returns.exchanges.policy', { supportEmail: CONTACT_INFO.SUPPORT_EMAIL })}
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('returns.shippingCosts.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('returns.shippingCosts.customerResponsibility')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('returns.shippingCosts.defectiveCoverage')}
          </Typography>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            {t('returns.needHelp.title')}
          </Typography>
          <Typography variant="body2">
            {t('returns.needHelp.message', {
              supportEmail: CONTACT_INFO.SUPPORT_EMAIL,
              supportPhone: CONTACT_INFO.SUPPORT_PHONE
            })}
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default ReturnsPage
