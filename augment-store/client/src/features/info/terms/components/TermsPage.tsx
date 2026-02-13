import React, { useState } from 'react'
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
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircleOutline as CheckIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  AssignmentReturn as ReturnIcon,
  Warning as WarningIcon,
  PrivacyTip as PrivacyIcon,
  Update as UpdateIcon,
  AccountBalance as LawIcon,
  ContactSupport as ContactIcon,
} from '@mui/icons-material'
import { Colors } from '@config/colors'
import { useTranslation } from '@hooks/useTranslation'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

const TermsPage = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string | false>('section-1')

  // Extract date for interpolation to avoid TypeScript compiler bug
  const lastUpdatedDate = t('terms.lastUpdatedDate')

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const sections: Section[] = [
    {
      id: 'section-1',
      title: t('terms.sections.acceptance.title'),
      icon: <GavelIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('terms.sections.acceptance.content')}
        </Typography>
      ),
    },
    {
      id: 'section-2',
      title: t('terms.sections.useLicense.title'),
      icon: <SecurityIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            {t('terms.sections.useLicense.intro')}
          </Typography>
          <List dense>
            {[
              t('terms.sections.useLicense.restrictions.modify'),
              t('terms.sections.useLicense.restrictions.commercial'),
              t('terms.sections.useLicense.restrictions.reverseEngineer'),
              t('terms.sections.useLicense.restrictions.removeCopyright'),
              t('terms.sections.useLicense.restrictions.transfer'),
            ].map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckIcon sx={{ color: Colors.error.main, fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
              </ListItem>
            ))}
          </List>
        </>
      ),
    },
    {
      id: 'section-3',
      title: t('terms.sections.accountTerms.title'),
      icon: <SecurityIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            {t('terms.sections.accountTerms.security')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {t('terms.sections.accountTerms.responsibility')}
          </Typography>
        </>
      ),
    },
    {
      id: 'section-4',
      title: t('terms.sections.productInfo.title'),
      icon: <ShoppingCartIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('terms.sections.productInfo.content')}
        </Typography>
      ),
    },
    {
      id: 'section-5',
      title: t('terms.sections.pricing.title'),
      icon: <PaymentIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            {t('terms.sections.pricing.changes')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {t('terms.sections.pricing.payment')}
          </Typography>
        </>
      ),
    },
    {
      id: 'section-6',
      title: t('terms.sections.shipping.title'),
      icon: <ShippingIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('terms.sections.shipping.content')}
        </Typography>
      ),
    },
    {
      id: 'section-7',
      title: t('terms.sections.returns.title'),
      icon: <ReturnIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('terms.sections.returns.content')}
        </Typography>
      ),
    },
    {
      id: 'section-8',
      title: t('terms.sections.liability.title'),
      icon: <WarningIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('terms.sections.liability.content')}
        </Typography>
      ),
    },
    {
      id: 'section-9',
      title: t('terms.sections.privacy.title'),
      icon: <PrivacyIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('terms.sections.privacy.content')}
        </Typography>
      ),
    },
    {
      id: 'section-10',
      title: t('terms.sections.modifications.title'),
      icon: <UpdateIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('terms.sections.modifications.content')}
        </Typography>
      ),
    },
    {
      id: 'section-11',
      title: t('terms.sections.governingLaw.title'),
      icon: <LawIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('terms.sections.governingLaw.content')}
        </Typography>
      ),
    },
    {
      id: 'section-12',
      title: t('terms.sections.contact.title'),
      icon: <ContactIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {t('terms.sections.contact.content')}
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
            background: Colors.gradient.purpleViolet,
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
              {t('terms.title')}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, mb: 2, fontSize: '1.1rem' }}>
              {t('terms.subtitle')}
            </Typography>
            <Chip
              label={t('terms.lastUpdatedLabel', { date: lastUpdatedDate })}
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
            {t('terms.title')}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {sections.map((section, index) => {
            const panelId = `terms-panel-${section.id}`
            const headerId = `terms-header-${section.id}`

            return (
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
                  id={headerId}
                  aria-controls={panelId}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(Colors.primary.main, 0.05),
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
                        backgroundColor: alpha(Colors.primary.main, 0.1),
                        color: Colors.primary.main,
                      }}
                    >
                      {section.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      {index + 1}. {section.title}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 2, pb: 3, px: 3 }}>
                  {section.content}
                </AccordionDetails>
              </Accordion>
            )
          })}
        </Paper>
      </Container>
    </Box>
  )
}

export default TermsPage

