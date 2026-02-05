import {
  Container,
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'

const HelpPage = () => {
  const { t } = useTranslation()

  const faqs = [
    {
      question: t('help.faqs.placeOrder.question'),
      answer: t('help.faqs.placeOrder.answer'),
    },
    {
      question: t('help.faqs.paymentMethods.question'),
      answer: t('help.faqs.paymentMethods.answer'),
    },
    {
      question: t('help.faqs.trackOrder.question'),
      answer: t('help.faqs.trackOrder.answer'),
    },
    {
      question: t('help.faqs.returnPolicy.question'),
      answer: t('help.faqs.returnPolicy.answer'),
    },
    {
      question: t('help.faqs.shippingTime.question'),
      answer: t('help.faqs.shippingTime.answer'),
    },
    {
      question: t('help.faqs.international.question'),
      answer: t('help.faqs.international.answer'),
    },
    {
      question: t('help.faqs.resetPassword.question'),
      answer: t('help.faqs.resetPassword.answer'),
    },
    {
      question: t('help.faqs.cancelOrder.question'),
      answer: t('help.faqs.cancelOrder.answer'),
    },
    {
      question: t('help.faqs.paymentSecurity.question'),
      answer: t('help.faqs.paymentSecurity.answer'),
    },
    {
      question: t('help.faqs.contactSupport.question'),
      answer: t('help.faqs.contactSupport.answer'),
    },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('help.title')}
        </Typography>

        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          {t('help.description')}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {t('help.faqsTitle')}
          </Typography>

          {faqs.map((faq, index) => (
            <Accordion key={index} sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.light', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            {t('help.stillNeedHelp.title')}
          </Typography>
          <Typography variant="body2">
            {t('help.stillNeedHelp.description')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default HelpPage
