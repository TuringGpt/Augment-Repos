import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { CONTACT_INFO } from '@constants/index'

const ShippingPage = () => {
  const domesticRates = [
    { method: 'Standard Shipping', time: '5-7 business days', cost: '$5.99' },
    { method: 'Express Shipping', time: '2-3 business days', cost: '$12.99' },
    { method: 'Overnight Shipping', time: '1 business day', cost: '$24.99' },
  ]

  const internationalRates = [
    { region: 'Canada', time: '7-14 business days', cost: '$15.99' },
    { region: 'Europe', time: '10-21 business days', cost: '$29.99' },
    { region: 'Asia', time: '10-21 business days', cost: '$29.99' },
    { region: 'Australia', time: '10-21 business days', cost: '$34.99' },
    { region: 'Rest of World', time: '14-28 business days', cost: '$39.99' },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Shipping Information
        </Typography>

        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          We offer various shipping options to meet your needs. All orders are processed within 1-2
          business days (excluding weekends and holidays).
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Domestic Shipping (United States)
          </Typography>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Shipping Method</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Delivery Time</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Cost</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {domesticRates.map((rate, index) => (
                  <TableRow key={index}>
                    <TableCell>{rate.method}</TableCell>
                    <TableCell>{rate.time}</TableCell>
                    <TableCell>{rate.cost}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            * Free standard shipping on orders of $50 or more
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            International Shipping
          </Typography>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Region</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Delivery Time</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Starting Cost</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {internationalRates.map((rate, index) => (
                  <TableRow key={index}>
                    <TableCell>{rate.region}</TableCell>
                    <TableCell>{rate.time}</TableCell>
                    <TableCell>{rate.cost}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            * International orders may be subject to customs fees and import duties
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Order Tracking
          </Typography>
          <Typography variant="body1" paragraph>
            Once your order has shipped, you will receive a confirmation email with a tracking
            number. You can track your package using this number on our website or the carrier's
            website.
          </Typography>
          <Typography variant="body1" paragraph>
            You can also view your order status anytime by logging into your account and visiting
            the "My Orders" section.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Shipping Restrictions
          </Typography>
          <Typography variant="body1" paragraph>
            We currently ship to most countries worldwide. However, some items may have shipping
            restrictions due to size, weight, or local regulations. These restrictions will be noted
            on the product page.
          </Typography>
          <Typography variant="body1" paragraph>
            We do not ship to P.O. boxes for certain items. Please provide a physical address for
            delivery when possible.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Damaged or Lost Packages
          </Typography>
          <Typography variant="body1" paragraph>
            If your package arrives damaged or goes missing during transit, please contact us
            immediately at {CONTACT_INFO.SUPPORT_EMAIL}. We will work with the carrier to resolve
            the issue and ensure you receive your order.
          </Typography>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Questions About Shipping?
          </Typography>
          <Typography variant="body2">
            If you have any questions about shipping or need assistance with your order, please
            contact our customer support team at {CONTACT_INFO.SUPPORT_EMAIL} or call{' '}
            {CONTACT_INFO.SUPPORT_PHONE}.
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default ShippingPage
