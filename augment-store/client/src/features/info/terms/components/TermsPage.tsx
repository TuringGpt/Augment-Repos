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

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

const TermsPage = () => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState<string | false>('section-1')

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const sections: Section[] = [
    {
      id: 'section-1',
      title: 'Acceptance of Terms',
      icon: <GavelIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          By accessing and using this e-commerce platform ("Service"), you accept and agree to be bound by the terms
          and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        </Typography>
      ),
    },
    {
      id: 'section-2',
      title: 'Use License',
      icon: <SecurityIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            Permission is granted to temporarily access the materials (information or software) on our platform for
            personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title,
            and under this license you may not:
          </Typography>
          <List dense>
            {[
              'Modify or copy the materials',
              'Use the materials for any commercial purpose or for any public display',
              'Attempt to reverse engineer any software contained on our platform',
              'Remove any copyright or other proprietary notations from the materials',
              'Transfer the materials to another person or "mirror" the materials on any other server',
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
      title: 'Account Terms',
      icon: <SecurityIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            You are responsible for maintaining the security of your account and password. We cannot and will not be
            liable for any loss or damage from your failure to comply with this security obligation.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            You are responsible for all content posted and activity that occurs under your account.
          </Typography>
        </>
      ),
    },
    {
      id: 'section-4',
      title: 'Product Information',
      icon: <ShoppingCartIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          We strive to provide accurate product descriptions and pricing. However, we do not warrant that product
          descriptions, pricing, or other content is accurate, complete, reliable, current, or error-free. If a product
          offered by us is not as described, your sole remedy is to return it in unused condition.
        </Typography>
      ),
    },
    {
      id: 'section-5',
      title: 'Pricing and Payment',
      icon: <PaymentIcon />,
      content: (
        <>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            All prices are subject to change without notice. We reserve the right to modify or discontinue products
            without notice. We shall not be liable to you or any third party for any modification, price change,
            suspension, or discontinuance of any product.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            Payment must be received by us before your order is dispatched. We accept various payment methods as
            indicated during checkout.
          </Typography>
        </>
      ),
    },
    {
      id: 'section-6',
      title: 'Shipping and Delivery',
      icon: <ShippingIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          We will arrange for shipment of ordered products to you. Please check the individual product page for
          specific delivery options. Title and risk of loss pass to you upon our delivery to the carrier. Shipping and
          handling charges are non-refundable.
        </Typography>
      ),
    },
    {
      id: 'section-7',
      title: 'Returns and Refunds',
      icon: <ReturnIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          Please review our Returns Policy for detailed information about returns and refunds. In general, items may be
          returned within 30 days of receipt in their original condition.
        </Typography>
      ),
    },
    {
      id: 'section-8',
      title: 'Limitation of Liability',
      icon: <WarningIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          In no event shall our company or its suppliers be liable for any damages (including, without limitation,
          damages for loss of data or profit, or due to business interruption) arising out of the use or inability to
          use the materials on our platform.
        </Typography>
      ),
    },
    {
      id: 'section-9',
      title: 'Privacy',
      icon: <PrivacyIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          Your use of our Service is also governed by our Privacy Policy. Please review our Privacy Policy, which also
          governs the Service and informs users of our data collection practices.
        </Typography>
      ),
    },
    {
      id: 'section-10',
      title: 'Modifications to Terms',
      icon: <UpdateIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          We reserve the right to revise these terms of service at any time without notice. By using this Service you
          are agreeing to be bound by the then current version of these terms of service.
        </Typography>
      ),
    },
    {
      id: 'section-11',
      title: 'Governing Law',
      icon: <LawIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          These terms and conditions are governed by and construed in accordance with the laws and you irrevocably
          submit to the exclusive jurisdiction of the courts in that location.
        </Typography>
      ),
    },
    {
      id: 'section-12',
      title: 'Contact Information',
      icon: <ContactIcon />,
      content: (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          If you have any questions about these Terms and Conditions, please contact us through our Contact page.
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
              Terms and Conditions
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.95, mb: 2, fontSize: '1.1rem' }}>
              Please read these terms carefully before using our service
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
              <AccordionDetails sx={{ pt: 2, pb: 3, px: 3 }}>{section.content}</AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Container>
    </Box>
  )
}

export default TermsPage

