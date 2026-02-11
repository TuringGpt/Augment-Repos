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
} from '@mui/icons-material'
import { Colors } from '@config/colors'

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
  const [expanded, setExpanded] = useState<string | false>('section-1')

  const handleChange = (panel: string) => (_event: SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const dataTypes: DataType[] = [
    {
      title: 'Identity Data',
      description: 'First name, last name, username or similar identifier',
      icon: <VerifiedUserIcon />,
    },
    {
      title: 'Contact Data',
      description: 'Email address, telephone numbers, billing address, delivery address',
      icon: <ContactIcon />,
    },
    {
      title: 'Financial Data',
      description: 'Payment card details (processed securely by our payment providers)',
      icon: <LockIcon />,
    },
    {
      title: 'Transaction Data',
      description: 'Details about payments and products you have purchased from us',
      icon: <ShieldIcon />,
    },
    {
      title: 'Technical Data',
      description: 'IP address, browser type and version, time zone setting, operating system',
      icon: <SettingsIcon />,
    },
    {
      title: 'Usage Data',
      description: 'Information about how you use our platform, products and services',
      icon: <VisibilityIcon />,
    },
  ]

  const sections: Section[] = [
    {
      id: 'section-1',
      title: 'Introduction',
      icon: <PrivacyIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          We respect your privacy and are committed to protecting your personal data. This privacy policy will inform
          you about how we look after your personal data when you visit our platform and tell you about your privacy
          rights and how the law protects you.
        </Typography>
      ),
    },
    {
      id: 'section-2',
      title: 'Information We Collect',
      icon: <InfoIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 3 }}>
            We may collect, use, store and transfer different kinds of personal data about you:
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
      title: 'How We Use Your Information',
      icon: <SettingsIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal
            data in the following circumstances:
          </Typography>
          <List dense>
            {[
              'To process and deliver your orders',
              'To manage your account and provide customer support',
              'To send you important information regarding your purchases',
              'To improve our platform and services',
              'To personalize your experience',
              'To send you marketing communications (with your consent)',
              'To detect and prevent fraud',
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
      title: 'Data Security',
      icon: <SecurityIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            We have put in place appropriate security measures to prevent your personal data from being accidentally
            lost, used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal data
            to those employees, agents, contractors and other third parties who have a business need to know.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            All payment transactions are encrypted using SSL technology. We do not store complete payment card details
            on our servers.
          </Typography>
        </>
      ),
    },
    {
      id: 'section-5',
      title: 'Data Retention',
      icon: <ScheduleIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for,
          including for the purposes of satisfying any legal, accounting, or reporting requirements.
        </Typography>
      ),
    },
    {
      id: 'section-6',
      title: 'Your Legal Rights',
      icon: <VerifiedUserIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            Under certain circumstances, you have rights under data protection laws in relation to your personal data:
          </Typography>
          <List dense>
            {[
              'Request access to your personal data',
              'Request correction of your personal data',
              'Request erasure of your personal data',
              'Object to processing of your personal data',
              'Request restriction of processing your personal data',
              'Request transfer of your personal data',
              'Right to withdraw consent',
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
      title: 'Cookies',
      icon: <CookieIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          Our platform uses cookies to distinguish you from other users. This helps us to provide you with a good
          experience when you browse our platform and also allows us to improve our site. A cookie is a small file of
          letters and numbers that we store on your browser or the hard drive of your computer.
        </Typography>
      ),
    },
    {
      id: 'section-8',
      title: 'Third-Party Links',
      icon: <LinkIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          Our platform may include links to third-party websites, plug-ins and applications. Clicking on those links or
          enabling those connections may allow third parties to collect or share data about you. We do not control these
          third-party websites and are not responsible for their privacy statements.
        </Typography>
      ),
    },
    {
      id: 'section-9',
      title: "Children's Privacy",
      icon: <ChildCareIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          Our Service is not intended for children under 13 years of age. We do not knowingly collect personal
          information from children under 13. If you are a parent or guardian and you are aware that your child has
          provided us with personal data, please contact us.
        </Typography>
      ),
    },
    {
      id: 'section-10',
      title: 'Changes to This Privacy Policy',
      icon: <UpdateIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
          Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
        </Typography>
      ),
    },
    {
      id: 'section-11',
      title: 'Contact Us',
      icon: <ContactIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          If you have any questions about this Privacy Policy or our privacy practices, please contact us through our
          Contact page.
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
                Privacy Policy
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ opacity: 0.95, mb: 2, fontSize: '1.1rem' }}>
              Your privacy is important to us. Learn how we collect, use, and protect your data.
            </Typography>
            <Chip
              label={`Last Updated: ${new Date().toLocaleDateString()}`}
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
            Table of Contents
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

