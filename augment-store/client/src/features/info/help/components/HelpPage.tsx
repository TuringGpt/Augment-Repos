import { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  Divider,
  useTheme,
  alpha,
  Fade,
  Chip,
} from '@mui/material'
import {
  ExpandMore,
  Search,
  HelpOutline,
  ShoppingCart,
  Payment,
  LocalShipping,
  AssignmentReturn,
  Security,
  AccountCircle,
  Email,
  Phone,
  ContactSupport,
  QuestionAnswer,
  LiveHelp,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@hooks/useTranslation'
import { CONTACT_INFO, ROUTES } from '@constants/index'
import { Colors } from '@config/colors'

interface FAQ {
  question: string
  answer: string
  category: string
  icon: React.ElementType
}

const HelpPage = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false)

  const faqs: FAQ[] = [
    {
      question: t('help.faqs.placeOrder.question'),
      answer: t('help.faqs.placeOrder.answer'),
      category: 'orders',
      icon: ShoppingCart,
    },
    {
      question: t('help.faqs.paymentMethods.question'),
      answer: t('help.faqs.paymentMethods.answer'),
      category: 'payment',
      icon: Payment,
    },
    {
      question: t('help.faqs.trackOrder.question'),
      answer: t('help.faqs.trackOrder.answer'),
      category: 'orders',
      icon: LocalShipping,
    },
    {
      question: t('help.faqs.returnPolicy.question'),
      answer: t('help.faqs.returnPolicy.answer'),
      category: 'returns',
      icon: AssignmentReturn,
    },
    {
      question: t('help.faqs.shippingTime.question'),
      answer: t('help.faqs.shippingTime.answer'),
      category: 'shipping',
      icon: LocalShipping,
    },
    {
      question: t('help.faqs.international.question'),
      answer: t('help.faqs.international.answer'),
      category: 'shipping',
      icon: LocalShipping,
    },
    {
      question: t('help.faqs.resetPassword.question'),
      answer: t('help.faqs.resetPassword.answer'),
      category: 'account',
      icon: AccountCircle,
    },
    {
      question: t('help.faqs.cancelOrder.question'),
      answer: t('help.faqs.cancelOrder.answer'),
      category: 'orders',
      icon: ShoppingCart,
    },
    {
      question: t('help.faqs.paymentSecurity.question'),
      answer: t('help.faqs.paymentSecurity.answer'),
      category: 'payment',
      icon: Security,
    },
    {
      question: t('help.faqs.contactSupport.question'),
      answer: t('help.faqs.contactSupport.answer', {
        supportEmail: CONTACT_INFO.SUPPORT_EMAIL,
        supportPhone: CONTACT_INFO.SUPPORT_PHONE,
      }),
      category: 'support',
      icon: ContactSupport,
    },
  ]

  const quickHelpCards = [
    {
      title: 'Track Your Order',
      description: 'Check the status of your order in real-time',
      icon: LocalShipping,
      color: theme.palette.info.main,
      action: () => navigate(ROUTES.ORDERS),
    },
    {
      title: 'Returns & Refunds',
      description: 'Learn about our return policy and process',
      icon: AssignmentReturn,
      color: theme.palette.warning.main,
      action: () => navigate(ROUTES.RETURNS),
    },
    {
      title: 'Contact Support',
      description: 'Get in touch with our support team',
      icon: ContactSupport,
      color: theme.palette.success.main,
      action: () => navigate(ROUTES.CONTACT),
    },
  ]

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : false)
  }

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      orders: theme.palette.primary.main,
      payment: theme.palette.success.main,
      shipping: theme.palette.info.main,
      returns: theme.palette.warning.main,
      account: theme.palette.secondary.main,
      support: theme.palette.error.main,
    }
    return colors[category] || theme.palette.grey[500]
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' ? Colors.dark.background.default : Colors.neutral.gray50,
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              mb: 4,
              background: Colors.gradient.blueIndigo,
              color: Colors.text.white,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '40%',
                height: '100%',
                background: Colors.overlay.light10,
                borderRadius: '50%',
                transform: 'translate(30%, -30%)',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <HelpOutline sx={{ fontSize: 48 }} />
                <Typography variant="h3" component="h1" fontWeight="bold">
                  {t('help.title')}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.95, maxWidth: '800px' }}>
                {t('help.description')}
              </Typography>
            </Box>
          </Paper>
        </Fade>

        {/* Search Bar */}
        <Fade in timeout={800}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 4,
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <TextField
              fullWidth
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.primary.main }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    border: 'none',
                  },
                },
              }}
            />
          </Paper>
        </Fade>

        {/* Quick Help Cards */}
        <Fade in timeout={1000}>
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Quick Help
            </Typography>
            <Grid container spacing={3}>
              {quickHelpCards.map((card, index) => {
                const Icon = card.icon
                return (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: theme.shadows[12],
                          borderColor: card.color,
                        },
                      }}
                      onClick={card.action}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 64,
                            height: 64,
                            borderRadius: 2,
                            bgcolor: alpha(card.color, 0.1),
                            mb: 2,
                          }}
                        >
                          <Icon sx={{ fontSize: 32, color: card.color }} />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {card.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {card.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        </Fade>

        {/* FAQs Section */}
        <Fade in timeout={1200}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <QuestionAnswer sx={{ fontSize: 32, color: theme.palette.primary.main }} />
              <Typography variant="h5" fontWeight="bold">
                {t('help.faqsTitle')}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {filteredFaqs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <HelpOutline sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No results found for "{searchQuery}"
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try searching with different keywords
                </Typography>
              </Box>
            ) : (
              <Box>
                {filteredFaqs.map((faq, index) => {
                  const Icon = faq.icon
                  return (
                    <Accordion
                      key={index}
                      expanded={expandedPanel === `panel${index}`}
                      onChange={handleAccordionChange(`panel${index}`)}
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:before': {
                          display: 'none',
                        },
                        '&.Mui-expanded': {
                          boxShadow: theme.shadows[4],
                          borderColor: getCategoryColor(faq.category),
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(getCategoryColor(faq.category), 0.05),
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              bgcolor: alpha(getCategoryColor(faq.category), 0.1),
                            }}
                          >
                            <Icon sx={{ fontSize: 20, color: getCategoryColor(faq.category) }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {faq.question}
                            </Typography>
                          </Box>
                          <Chip
                            label={faq.category}
                            size="small"
                            sx={{
                              bgcolor: alpha(getCategoryColor(faq.category), 0.1),
                              color: getCategoryColor(faq.category),
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 3, px: 3 }}>
                        <Box sx={{ pl: 7 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                            {faq.answer}
                          </Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )
                })}
              </Box>
            )}
          </Paper>
        </Fade>

        {/* Contact Support Section */}
        <Fade in timeout={1400}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              background: Colors.gradient.purpleViolet,
              color: Colors.text.white,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '50%',
                height: '100%',
                background: Colors.overlay.light10,
                borderRadius: '50%',
                transform: 'translate(-30%, 30%)',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <LiveHelp sx={{ fontSize: 40 }} />
                <Typography variant="h5" fontWeight="bold">
                  {t('help.stillNeedHelp.title')}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                {t('help.stillNeedHelp.description')}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Email />}
                    onClick={() => navigate(ROUTES.CONTACT)}
                    sx={{
                      bgcolor: 'white',
                      color: theme.palette.primary.main,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: alpha('#fff', 0.9),
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Contact Us
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Phone />}
                    href={`tel:${CONTACT_INFO.SUPPORT_PHONE}`}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      py: 1.5,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: alpha('#fff', 0.1),
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {CONTACT_INFO.SUPPORT_PHONE}
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Email />}
                    href={`mailto:${CONTACT_INFO.SUPPORT_EMAIL}`}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      py: 1.5,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: alpha('#fff', 0.1),
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Email Us
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  )
}

export default HelpPage
