import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Fade,
  Slide,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
} from '@mui/material'
import {
  AssignmentReturn,
  CheckCircle,
  Cancel,
  LocalShipping,
  AttachMoney,
  SwapHoriz,
  Info,
  HelpOutline,
  Email,
  Phone,
  Schedule,
  VerifiedUser,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { CONTACT_INFO } from '@constants/index'

const ReturnsPage = () => {
  const { t } = useTranslation()
  const theme = useTheme()

  const returnSteps = [
    {
      label: t('returns.howToReturn.steps.step1'),
      icon: <Email sx={{ fontSize: 20 }} />,
    },
    {
      label: t('returns.howToReturn.steps.step2'),
      icon: <AssignmentReturn sx={{ fontSize: 20 }} />,
    },
    {
      label: t('returns.howToReturn.steps.step3'),
      icon: <LocalShipping sx={{ fontSize: 20 }} />,
    },
    {
      label: t('returns.howToReturn.steps.step4'),
      icon: <Schedule sx={{ fontSize: 20 }} />,
    },
    {
      label: t('returns.howToReturn.steps.step5'),
      icon: <AttachMoney sx={{ fontSize: 20 }} />,
    },
  ]

  const policyConditions = [
    {
      text: t('returns.returnPolicy.conditions.unused'),
      icon: <CheckCircle sx={{ color: theme.palette.success.main }} />,
    },
    {
      text: t('returns.returnPolicy.conditions.originalPackaging'),
      icon: <CheckCircle sx={{ color: theme.palette.success.main }} />,
    },
    {
      text: t('returns.returnPolicy.conditions.receipt'),
      icon: <CheckCircle sx={{ color: theme.palette.success.main }} />,
    },
  ]

  const nonReturnableItems = [
    {
      text: t('returns.nonReturnableItems.items.perishable'),
      icon: <Cancel sx={{ color: theme.palette.error.main }} />,
    },
    {
      text: t('returns.nonReturnableItems.items.custom'),
      icon: <Cancel sx={{ color: theme.palette.error.main }} />,
    },
    {
      text: t('returns.nonReturnableItems.items.personalCare'),
      icon: <Cancel sx={{ color: theme.palette.error.main }} />,
    },
    {
      text: t('returns.nonReturnableItems.items.hazardous'),
      icon: <Cancel sx={{ color: theme.palette.error.main }} />,
    },
    {
      text: t('returns.nonReturnableItems.items.giftCards'),
      icon: <Cancel sx={{ color: theme.palette.error.main }} />,
    },
    {
      text: t('returns.nonReturnableItems.items.digital'),
      icon: <Cancel sx={{ color: theme.palette.error.main }} />,
    },
  ]

  const infoCards = [
    {
      icon: AttachMoney,
      title: t('returns.refunds.title'),
      description: t('returns.refunds.inspection'),
      additionalInfo: t('returns.refunds.processing'),
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
    },
    {
      icon: SwapHoriz,
      title: t('returns.exchanges.title'),
      description: t('returns.exchanges.policy', { supportEmail: CONTACT_INFO.SUPPORT_EMAIL }),
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1),
    },
    {
      icon: LocalShipping,
      title: t('returns.shippingCosts.title'),
      description: t('returns.shippingCosts.customerResponsibility'),
      additionalInfo: t('returns.shippingCosts.defectiveCoverage'),
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
    },
  ]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.1)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha('#ffffff', 0.95)} 100%)`,
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Fade in={true} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                mb: 3,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <AssignmentReturn sx={{ fontSize: 48, color: '#fff' }} />
            </Box>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              {t('returns.title')}
            </Typography>
            <Chip
              icon={<VerifiedUser />}
              label={t('returns.satisfactionAlert')}
              color="primary"
              sx={{
                py: 2.5,
                px: 1,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: theme.shadows[4],
              }}
            />
          </Box>
        </Fade>

        {/* Return Policy Section */}
        <Slide direction="up" in={true} timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              boxShadow: theme.shadows[8],
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : theme.palette.background.paper,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                }}
              >
                <Info sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {t('returns.returnPolicy.title')}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
              {t('returns.returnPolicy.intro')}
            </Typography>
            <List>
              {policyConditions.map((condition, index) => (
                <Fade in={true} timeout={800 + index * 100} key={index}>
                  <ListItem
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        transform: 'translateX(8px)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{condition.icon}</ListItemIcon>
                    <ListItemText
                      primary={condition.text}
                      primaryTypographyProps={{
                        fontSize: '1rem',
                        fontWeight: 500,
                      }}
                    />
                  </ListItem>
                </Fade>
              ))}
            </List>
          </Paper>
        </Slide>

        {/* How to Return Section */}
        <Slide direction="up" in={true} timeout={700}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              boxShadow: theme.shadows[8],
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : theme.palette.background.paper,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  display: 'flex',
                }}
              >
                <HelpOutline sx={{ color: theme.palette.secondary.main, fontSize: 32 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {t('returns.howToReturn.title')}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Stepper
              orientation="vertical"
              sx={{
                '& .MuiStepConnector-root': {
                  marginLeft: '20px',
                },
                '& .MuiStepConnector-line': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  borderLeftWidth: 2,
                  minHeight: '24px',
                },
              }}
            >
              {returnSteps.map((step, index) => (
                <Step key={index} active={true} completed={false}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `2px solid ${theme.palette.primary.main}`,
                          color: theme.palette.primary.main,
                        }}
                      >
                        {step.icon}
                      </Box>
                    )}
                    sx={{
                      '& .MuiStepLabel-iconContainer': {
                        paddingRight: '12px',
                      },
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.05rem', ml: 1 }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent
                    sx={{
                      marginLeft: '20px',
                      paddingLeft: '32px',
                      borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    <Box sx={{ pb: 1 }} />
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Slide>

        {/* Non-Returnable Items Section */}
        <Slide direction="up" in={true} timeout={800}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              boxShadow: theme.shadows[8],
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : theme.palette.background.paper,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  display: 'flex',
                }}
              >
                <Cancel sx={{ color: theme.palette.error.main, fontSize: 32 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {t('returns.nonReturnableItems.title')}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
              {t('returns.nonReturnableItems.intro')}
            </Typography>
            <Grid container spacing={2}>
              {nonReturnableItems.map((item, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Fade in={true} timeout={900 + index * 100}>
                    <Card
                      elevation={0}
                      sx={{
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.15)}`,
                          borderColor: theme.palette.error.main,
                        },
                      }}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {item.icon}
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {item.text}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Slide>

        {/* Info Cards Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {infoCards.map((card, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Fade in={true} timeout={1000 + index * 200}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: theme.shadows[8],
                    border: `1px solid ${alpha(card.color, 0.2)}`,
                    transition: 'all 0.3s ease',
                    background:
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.8)
                        : theme.palette.background.paper,
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 32px ${alpha(card.color, 0.25)}`,
                      borderColor: card.color,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: card.bgColor,
                        mb: 2,
                      }}
                    >
                      <card.icon sx={{ fontSize: 36, color: card.color }} />
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" paragraph sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
                      {card.description}
                    </Typography>
                    {card.additionalInfo && (
                      <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
                        {card.additionalInfo}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Need Help Section */}
        <Fade in={true} timeout={1400}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: theme.shadows[8],
              border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.1)} 0%, ${alpha(
                theme.palette.warning.main,
                0.05
              )} 100%)`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.2),
                  display: 'flex',
                }}
              >
                <HelpOutline sx={{ color: theme.palette.warning.main, fontSize: 32 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {t('returns.needHelp.title')}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                    }}
                  >
                    <Email sx={{ color: theme.palette.primary.main }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('returns.contact.email')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {CONTACT_INFO.SUPPORT_EMAIL}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      display: 'flex',
                    }}
                  >
                    <Phone sx={{ color: theme.palette.success.main }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('returns.contact.phone')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {CONTACT_INFO.SUPPORT_PHONE}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Fade>
      </Container>
    </Box>
  )
}

export default ReturnsPage
