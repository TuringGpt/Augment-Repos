import { useState, ReactNode, SyntheticEvent } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Grid,
  Card,
  CardContent,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  PrivacyTip as PrivacyIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  VerifiedUser as VerifiedUserIcon,
  Cookie as CookieIcon,
  Link as LinkIcon,
  ChildCare as ChildCareIcon,
  Update as UpdateIcon,
  ContactSupport as ContactIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material'
import { Colors } from '@config/colors'
import { useTranslation } from '@hooks/useTranslation'

interface Section {
  id: string
  title: string
  icon: ReactNode
  content: ReactNode
}

interface DataType {
  title: string
  description: string
  icon: ReactNode
}

const PrivacyPage = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string | false>('section-1')

  // Extract date for interpolation to avoid TypeScript compiler bug
  const lastUpdatedDate = t('privacy.lastUpdatedDate')

  const handleChange = (panel: string) => (_: SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const dataTypes: DataType[] = [
    {
      title: t('privacy.dataTypes.identity.title'),
      description: t('privacy.dataTypes.identity.description'),
      icon: <VerifiedUserIcon />,
    },
    {
      title: t('privacy.dataTypes.contact.title'),
      description: t('privacy.dataTypes.contact.description'),
      icon: <ContactIcon />,
    },
    {
      title: t('privacy.dataTypes.financial.title'),
      description: t('privacy.dataTypes.financial.description'),
      icon: <LockIcon />,
    },
    {
      title: t('privacy.dataTypes.transaction.title'),
      description: t('privacy.dataTypes.transaction.description'),
      icon: <ShieldIcon />,
    },
    {
      title: t('privacy.dataTypes.technical.title'),
      description: t('privacy.dataTypes.technical.description'),
      icon: <SettingsIcon />,
    },
    {
      title: t('privacy.dataTypes.usage.title'),
      description: t('privacy.dataTypes.usage.description'),
      icon: <VisibilityIcon />,
    },
    {
      title: t('privacy.dataTypes.marketing.title'),
      description: t('privacy.dataTypes.marketing.description'),
      icon: <CampaignIcon />,
    },
  ]

  const sections: Section[] = [
    {
      id: 'section-1',
      title: t('privacy.sections.introduction.title'),
      icon: <PrivacyIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('privacy.sections.introduction.content')}
        </Typography>
      ),
    },
    {
      id: 'section-2',
      title: t('privacy.sections.informationWeCollect.title'),
      icon: <InfoIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 3 }}>
            {t('privacy.sections.informationWeCollect.intro')}
          </Typography>
          <Grid container spacing={2}>
            {dataTypes.map((dataType, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: alpha(Colors.primary.main, 0.03),
                    border: `1px solid ${alpha(Colors.primary.main, 0.1)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: alpha(Colors.primary.main, 0.08),
                      transform: 'translateY(-2px)',
                      boxShadow: Colors.shadow.medium,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          backgroundColor: alpha(Colors.primary.main, 0.15),
                          color: Colors.primary.main,
                          flexShrink: 0,
                        }}
                      >
                        {dataType.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {dataType.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {dataType.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ),
    },
    {
      id: 'section-3',
      title: t('privacy.sections.howWeUse.title'),
      icon: <SettingsIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            {t('privacy.sections.howWeUse.intro')}
          </Typography>
          <List dense>
            {[
              t('privacy.sections.howWeUse.purposes.processOrders'),
              t('privacy.sections.howWeUse.purposes.manageAccount'),
              t('privacy.sections.howWeUse.purposes.sendInfo'),
              t('privacy.sections.howWeUse.purposes.improve'),
              t('privacy.sections.howWeUse.purposes.personalize'),
              t('privacy.sections.howWeUse.purposes.marketing'),
              t('privacy.sections.howWeUse.purposes.fraud'),
            ].map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckIcon sx={{ color: Colors.success.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
              </ListItem>
            ))}
          </List>
        </>
      ),
    },
    {
      id: 'section-4',
      title: t('privacy.sections.dataSecurity.title'),
      icon: <SecurityIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            {t('privacy.sections.dataSecurity.paragraph1')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {t('privacy.sections.dataSecurity.paragraph2')}
          </Typography>
        </>
      ),
    },
    {
      id: 'section-5',
      title: t('privacy.sections.dataRetention.title'),
      icon: <ScheduleIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('privacy.sections.dataRetention.content')}
        </Typography>
      ),
    },
    {
      id: 'section-6',
      title: t('privacy.sections.yourRights.title'),
      icon: <VerifiedUserIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            {t('privacy.sections.yourRights.intro')}
          </Typography>
          <List dense>
            {[
              t('privacy.sections.yourRights.rights.access'),
              t('privacy.sections.yourRights.rights.correction'),
              t('privacy.sections.yourRights.rights.erasure'),
              t('privacy.sections.yourRights.rights.object'),
              t('privacy.sections.yourRights.rights.restriction'),
              t('privacy.sections.yourRights.rights.transfer'),
              t('privacy.sections.yourRights.rights.withdraw'),
            ].map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckIcon sx={{ color: Colors.info.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
              </ListItem>
            ))}
          </List>
        </>
      ),
    },
    {
      id: 'section-7',
      title: t('privacy.sections.cookies.title'),
      icon: <CookieIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('privacy.sections.cookies.content')}
        </Typography>
      ),
    },
    {
      id: 'section-8',
      title: t('privacy.sections.thirdPartyLinks.title'),
      icon: <LinkIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('privacy.sections.thirdPartyLinks.content')}
        </Typography>
      ),
    },
    {
      id: 'section-9',
      title: t('privacy.sections.childrenPrivacy.title'),
      icon: <ChildCareIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('privacy.sections.childrenPrivacy.content')}
        </Typography>
      ),
    },
    {
      id: 'section-10',
      title: t('privacy.sections.changes.title'),
      icon: <UpdateIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('privacy.sections.changes.content')}
        </Typography>
      ),
    },
    {
      id: 'section-11',
      title: t('privacy.sections.contact.title'),
      icon: <ContactIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('privacy.sections.contact.content')}
        </Typography>
      ),
    },
  ]

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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  backgroundColor: Colors.overlay.light20,
                }}
              >
                <ShieldIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                }}
              >
                {t('privacy.pageTitle')}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.95, mb: 2, fontSize: '1.1rem' }}>
              {t('privacy.pageSubtitle')}
            </Typography>
            <Chip
              label={t('privacy.lastUpdated', { date: lastUpdatedDate })}
              sx={{
                backgroundColor: Colors.overlay.light20,
                color: Colors.text.white,
                fontWeight: 500,
              }}
            />
          </Box>
        </Paper>

        {/* Content Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 4 },
            borderRadius: 3,
            backgroundColor: theme.palette.mode === 'dark' ? Colors.dark.background.paper : Colors.neutral.white,
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 600,
              mb: 3,
              color: theme.palette.mode === 'dark' ? Colors.dark.text.primary : Colors.text.primary,
            }}
          >
            {t('privacy.tableOfContents')}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {sections.map((section, index) => (
            <Accordion
              key={section.id}
              expanded={expanded === section.id}
              onChange={handleChange(section.id)}
              sx={{
                mb: 2,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: expanded === section.id ? Colors.shadow.medium : Colors.shadow.light,
                transition: 'all 0.3s ease',
                backgroundColor: theme.palette.mode === 'dark' ? Colors.dark.background.elevated : Colors.neutral.white,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(Colors.info.main, 0.05),
                  },
                  borderRadius: 2,
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
                      borderRadius: 2,
                      backgroundColor: alpha(Colors.info.main, 0.1),
                      color: Colors.info.main,
                    }}
                  >
                    {section.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                    {index + 1}. {section.title}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2, pb: 3, px: 3 }}>{section.content}</AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Container>
    </Box>
  )
}

export default PrivacyPage

