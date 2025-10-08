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

const HelpPage = () => {
  const faqs = [
    {
      question: 'How do I place an order?',
      answer:
        "Browse our products, add items to your cart, and proceed to checkout. You'll need to create an account or log in to complete your purchase.",
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and other secure payment methods.',
    },
    {
      question: 'How can I track my order?',
      answer:
        'Once your order ships, you\'ll receive a tracking number via email. You can also view your order status in the "My Orders" section of your account.',
    },
    {
      question: 'What is your return policy?',
      answer:
        'We offer a 30-day return policy for most items. Products must be unused and in original packaging. See our Returns page for full details.',
    },
    {
      question: 'How long does shipping take?',
      answer:
        'Standard shipping typically takes 5-7 business days. Express shipping options are available at checkout for faster delivery.',
    },
    {
      question: 'Do you ship internationally?',
      answer:
        'Yes, we ship to many countries worldwide. Shipping costs and delivery times vary by location. International orders may be subject to customs fees.',
    },
    {
      question: 'How do I reset my password?',
      answer:
        'Click on "Forgot Password" on the login page. Enter your email address and we\'ll send you instructions to reset your password.',
    },
    {
      question: 'Can I cancel or modify my order?',
      answer:
        'Orders can be cancelled or modified within 1 hour of placement. After that, please contact customer support for assistance.',
    },
    {
      question: 'Are my payment details secure?',
      answer:
        'Yes, we use industry-standard SSL encryption to protect your payment information. We never store your full credit card details on our servers.',
    },
    {
      question: 'How do I contact customer support?',
      answer:
        'You can reach us via email at support@augmentstore.com, by phone at +1 (555) 123-4567, or through our Contact page.',
    },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Help Center
        </Typography>

        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          Find answers to frequently asked questions below. If you need additional assistance,
          please don't hesitate to contact our customer support team.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Frequently Asked Questions
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
            Still Need Help?
          </Typography>
          <Typography variant="body2">
            If you couldn't find the answer you're looking for, our customer support team is ready
            to assist you. Contact us via email, phone, or our contact form.
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default HelpPage
