import { Container, Typography, Box, Paper } from '@mui/material'
import { useTranslation } from '@hooks/useTranslation'

const AboutPage = () => {
  const { t } = useTranslation()

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('about.title')}
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('about.ourStory')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('about.ourStoryContent')}
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('about.ourMission')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('about.ourMissionContent')}
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('about.whyChooseUs')}
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>{t('about.reasons.wideSelection')}</li>
              <li>{t('about.reasons.competitivePricing')}</li>
              <li>{t('about.reasons.fastShipping')}</li>
              <li>{t('about.reasons.excellentSupport')}</li>
              <li>{t('about.reasons.securePayment')}</li>
              <li>{t('about.reasons.easyReturns')}</li>
            </ul>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default AboutPage
