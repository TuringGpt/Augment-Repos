import { Container, Typography, Box, Paper, Alert } from '@mui/material'

const ReturnsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Returns & Refunds
        </Typography>

        <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
          We want you to be completely satisfied with your purchase. If you're not happy with your
          order, we're here to help.
        </Alert>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Return Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We offer a 30-day return policy for most items. To be eligible for a return, your item
            must be:
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>Unused and in the same condition that you received it</li>
              <li>In the original packaging</li>
              <li>Accompanied by the receipt or proof of purchase</li>
            </ul>
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Non-Returnable Items
          </Typography>
          <Typography variant="body1" paragraph>
            Certain items cannot be returned, including:
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>Perishable goods (food, flowers, etc.)</li>
              <li>Custom or personalized items</li>
              <li>Personal care items (for hygiene reasons)</li>
              <li>Hazardous materials</li>
              <li>Gift cards</li>
              <li>Downloadable software or digital products</li>
            </ul>
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            How to Return an Item
          </Typography>
          <Typography variant="body1" component="div">
            <ol>
              <li>Log in to your account and go to "My Orders"</li>
              <li>Select the order containing the item you wish to return</li>
              <li>Click "Request Return" and follow the instructions</li>
              <li>Pack the item securely in its original packaging</li>
              <li>Ship the item to the address provided in your return confirmation</li>
            </ol>
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Refunds
          </Typography>
          <Typography variant="body1" paragraph>
            Once we receive your return, we will inspect the item and notify you of the approval or
            rejection of your refund.
          </Typography>
          <Typography variant="body1" paragraph>
            If approved, your refund will be processed and a credit will automatically be applied to
            your original method of payment within 5-10 business days.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Exchanges
          </Typography>
          <Typography variant="body1" paragraph>
            We only replace items if they are defective or damaged. If you need to exchange an item
            for the same product, please contact us at support@augmentstore.com.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Shipping Costs
          </Typography>
          <Typography variant="body1" paragraph>
            You will be responsible for paying your own shipping costs for returning your item.
            Shipping costs are non-refundable. If you receive a refund, the cost of return shipping
            will be deducted from your refund.
          </Typography>
          <Typography variant="body1" paragraph>
            If the item was defective or damaged upon arrival, we will cover the return shipping
            costs.
          </Typography>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Need Help?
          </Typography>
          <Typography variant="body2">
            If you have any questions about our return policy, please contact our customer support
            team at support@augmentstore.com or call +1 (555) 123-4567.
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default ReturnsPage
