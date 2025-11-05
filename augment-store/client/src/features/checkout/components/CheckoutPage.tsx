import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import OrderSummary from './OrderSummary'

const CheckoutPage = () => {
  return (
    <Container maxWidth="xl">
      <Typography variant="h1" gutterBottom>
        Checkout
      </Typography>
      <Typography color="text.secondary">1 item(s)</Typography>
      <Stack direction="row" sx={{alignItems: "flex-start"}}>
        <Container>
          {/* Work in Progress */}
          <Accordion>
            <AccordionSummary>
              <Typography>Contact Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Accordion 1 Content</Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary>
              <Typography>Shipping Address</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Accordion 2 Content</Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary>
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
