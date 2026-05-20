import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  useTheme,
  Fade,
  Chip,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Support as SupportIcon,
  Security as SecurityIcon,
  AttachMoney as MoneyIcon,
  Autorenew as AutorenewIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { Colors } from '@config/colors'
import type { ReactNode } from 'react'

interface FeatureCard {
  icon: ReactNode
  title: string
  description: string
}

interface StatCard {
  icon: ReactNode
  value: string
  label: string
  color: string
}

const AboutPage = () => {
  const { t } = useTranslation()
  const theme = useTheme()

  const features: FeatureCard[] = [
    {
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      title: t('about.reasons.wideSelection'),
      description: t('about.reasons.wideSelectionDesc'),
    },
    {
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      title: t('about.reasons.competitivePricing'),
      description: t('about.reasons.competitivePricingDesc'),
    },
    {
      icon: <ShippingIcon sx={{ fontSize: 40 }} />,
      title: t('about.reasons.fastShipping'),
      description: t('about.reasons.fastShippingDesc'),
    },
    {
      icon: <SupportIcon sx={{ fontSize: 40 }} />,
      title: t('about.reasons.excellentSupport'),
      description: t('about.reasons.excellentSupportDesc'),
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: t('about.reasons.securePayment'),
      description: t('about.reasons.securePaymentDesc'),
    },
    {
      icon: <AutorenewIcon sx={{ fontSize: 40 }} />,
      title: t('about.reasons.easyReturns'),
      description: t('about.reasons.easyReturnsDesc'),
    },
  ]

  const stats: StatCard[] = [
    {
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      value: '50K+',
      label: t('about.stats.happyCustomers'),
      color: Colors.primary.main,
    },
    {
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      value: '10K+',
      label: t('about.stats.products'),
      color: Colors.secondary.main,
    },
    {
      icon: <StarIcon sx={{ fontSize: 40 }} />,
      value: '4.8/5',
      label: t('about.stats.averageRating'),
      color: Colors.warning.main,
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 40 }} />,
      value: '99%',
      label: t('about.stats.satisfactionRate'),
      color: Colors.success.main,
    },
  ]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          theme.palette.mode === 'dark' ? Colors.dark.background.default : Colors.neutral.gray50,
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Fade in={true} timeout={800}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              mb: 6,
              background: Colors.gradient.oceanBlue,
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
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  mb: 2,
                }}
              >
                {t('about.title')}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, mb: 2, fontSize: '1.1rem' }}>
                {t('about.subtitle')}
              </Typography>
              <Chip
                label={t('about.established')}
                sx={{
                  backgroundColor: Colors.overlay.light20,
                  color: Colors.text.white,
                  fontWeight: 500,
                }}
              />
            </Box>
          </Paper>
        </Fade>

        {/* Stats Section */}
        <Fade in={true} timeout={1000}>
          <Box sx={{ mb: 6 }}>
            <Grid container spacing={3}>
              {stats.map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      p: 3,
                      borderRadius: 2,
                      background:
                        theme.palette.mode === 'dark'
                          ? Colors.dark.background.paper
                          : Colors.neutral.white,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: Colors.shadow.medium,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: '50%',
                        backgroundColor: alpha(stat.color, 0.1),
                        color: stat.color,
                        mb: 2,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: stat.color,
                        mb: 1,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>

        {/* Story and Mission Section */}
        <Fade in={true} timeout={1200}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 6,
              borderRadius: 3,
              background:
                theme.palette.mode === 'dark' ? Colors.dark.background.paper : Colors.neutral.white,
            }}
          >
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 40,
                      background: Colors.gradient.oceanBlue,
                      borderRadius: 2,
                      mr: 2,
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      background: Colors.gradient.oceanBlue,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {t('about.ourStory')}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {t('about.ourStoryContent')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 40,
                      background: Colors.gradient.greenTeal,
                      borderRadius: 2,
                      mr: 2,
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      background: Colors.gradient.greenTeal,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {t('about.ourMission')}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {t('about.ourMissionContent')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Fade>

        {/* Why Choose Us Section */}
        <Fade in={true} timeout={1400}>
          <Box>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 700,
                textAlign: 'center',
                mb: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('about.whyChooseUs')}
            </Typography>

            <Grid container spacing={3}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      p: 3,
                      borderRadius: 2,
                      background:
                        theme.palette.mode === 'dark'
                          ? Colors.dark.background.paper
                          : Colors.neutral.white,
                      transition: 'all 0.3s ease',
                      border: `1px solid ${
                        theme.palette.mode === 'dark' ? Colors.dark.border : Colors.border.light
                      }`,
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: Colors.shadow.medium,
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          mb: 2,
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}

export default AboutPage
