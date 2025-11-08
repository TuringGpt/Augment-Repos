import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  Stack,
  Typography,
  TextField,
  Grid,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import OrderSummary from '@/features/checkout/components/OrderSummary'

const CheckoutPage = () => {
  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
  })

  const handleContactChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h1" gutterBottom>
        Checkout
      </Typography>
      <Stack direction="row" sx={{alignItems: "flex-start"}}>
        <Container>
          {/* Contact Information */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Contact Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={contactInfo.firstName}
                    onChange={handleContactChange('firstName')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={contactInfo.lastName}
                    onChange={handleContactChange('lastName')}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={contactInfo.email}
                    onChange={handleContactChange('email')}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={handleContactChange('phone')}
                    required
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Shipping Address</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Accordion 2 Content</Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Billing Address</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Accordion 3 Content</Typography>
            </AccordionDetails>
          </Accordion>
        </Container>
        <OrderSummary />
      </Stack>
    </Container>
  )
}

export default CheckoutPage
