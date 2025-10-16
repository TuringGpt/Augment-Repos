import { Box, Container, Typography, Paper } from '@mui/material'
import { Colors } from '@config/colors'

const TermsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: Colors.text.primary,
            mb: 3,
          }}
        >
          Terms and Conditions
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Last Updated: {new Date().toLocaleDateString()}
        </Typography>

        <Box sx={{ '& > *': { mb: 3 } }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              1. Acceptance of Terms
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              By accessing and using this e-commerce platform ("Service"), you accept and agree to be bound by the
              terms and provision of this agreement. If you do not agree to abide by the above, please do not use
              this service.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              2. Use License
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Permission is granted to temporarily access the materials (information or software) on our platform for
              personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of
              title, and under this license you may not:
            </Typography>
            <Box component="ul" sx={{ pl: 4, color: Colors.text.secondary }}>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on our platform</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              3. Account Terms
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You are responsible for maintaining the security of your account and password. We cannot and will not be
              liable for any loss or damage from your failure to comply with this security obligation.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You are responsible for all content posted and activity that occurs under your account.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              4. Product Information
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We strive to provide accurate product descriptions and pricing. However, we do not warrant that product
              descriptions, pricing, or other content is accurate, complete, reliable, current, or error-free. If a
              product offered by us is not as described, your sole remedy is to return it in unused condition.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              5. Pricing and Payment
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              All prices are subject to change without notice. We reserve the right to modify or discontinue products
              without notice. We shall not be liable to you or any third party for any modification, price change,
              suspension, or discontinuance of any product.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Payment must be received by us before your order is dispatched. We accept various payment methods as
              indicated during checkout.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              6. Shipping and Delivery
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We will arrange for shipment of ordered products to you. Please check the individual product page for
              specific delivery options. Title and risk of loss pass to you upon our delivery to the carrier. Shipping
              and handling charges are non-refundable.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              7. Returns and Refunds
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Please review our Returns Policy for detailed information about returns and refunds. In general, items
              may be returned within 30 days of receipt in their original condition.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              8. Limitation of Liability
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              In no event shall our company or its suppliers be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability
              to use the materials on our platform.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              9. Privacy
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your use of our Service is also governed by our Privacy Policy. Please review our Privacy Policy, which
              also governs the Service and informs users of our data collection practices.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              10. Modifications to Terms
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We reserve the right to revise these terms of service at any time without notice. By using this Service
              you are agreeing to be bound by the then current version of these terms of service.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              11. Governing Law
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably
              submit to the exclusive jurisdiction of the courts in that location.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: Colors.text.primary }}>
              12. Contact Information
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              If you have any questions about these Terms and Conditions, please contact us through our Contact page.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default TermsPage

