import { Box, Container, Typography, Paper } from '@mui/material'

const PrivacyPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            mb: 3,
          }}
        >
          Privacy Policy
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Last Updated: {new Date().toLocaleDateString()}
        </Typography>

        <Box sx={{ '& > *': { mb: 3 } }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              1. Introduction
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We respect your privacy and are committed to protecting your personal data. This privacy policy will
              inform you about how we look after your personal data when you visit our platform and tell you about
              your privacy rights and how the law protects you.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              2. Information We Collect
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We may collect, use, store and transfer different kinds of personal data about you:
            </Typography>
            <Box component="ul" sx={{ pl: 4, color: 'text.secondary' }}>
              <li>
                <strong>Identity Data:</strong> First name, last name, username or similar identifier
              </li>
              <li>
                <strong>Contact Data:</strong> Email address, telephone numbers, billing address, delivery address
              </li>
              <li>
                <strong>Financial Data:</strong> Payment card details (processed securely by our payment providers)
              </li>
              <li>
                <strong>Transaction Data:</strong> Details about payments and products you have purchased from us
              </li>
              <li>
                <strong>Technical Data:</strong> IP address, browser type and version, time zone setting, browser
                plug-in types and versions, operating system and platform
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you use our platform, products and services
              </li>
              <li>
                <strong>Marketing Data:</strong> Your preferences in receiving marketing from us and your communication
                preferences
              </li>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              3. How We Use Your Information
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal
              data in the following circumstances:
            </Typography>
            <Box component="ul" sx={{ pl: 4, color: 'text.secondary' }}>
              <li>To process and deliver your orders</li>
              <li>To manage your account and provide customer support</li>
              <li>To send you important information regarding your purchases</li>
              <li>To improve our platform and services</li>
              <li>To personalize your experience</li>
              <li>To send you marketing communications (with your consent)</li>
              <li>To detect and prevent fraud</li>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              4. Data Security
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We have put in place appropriate security measures to prevent your personal data from being accidentally
              lost, used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal
              data to those employees, agents, contractors and other third parties who have a business need to know.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              All payment transactions are encrypted using SSL technology. We do not store complete payment card
              details on our servers.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              5. Data Retention
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We will only retain your personal data for as long as necessary to fulfill the purposes we collected it
              for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              6. Your Legal Rights
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Under certain circumstances, you have rights under data protection laws in relation to your personal
              data:
            </Typography>
            <Box component="ul" sx={{ pl: 4, color: 'text.secondary' }}>
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Right to withdraw consent</li>
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              7. Cookies
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Our platform uses cookies to distinguish you from other users. This helps us to provide you with a good
              experience when you browse our platform and also allows us to improve our site. A cookie is a small file
              of letters and numbers that we store on your browser or the hard drive of your computer.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              8. Third-Party Links
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Our platform may include links to third-party websites, plug-ins and applications. Clicking on those
              links or enabling those connections may allow third parties to collect or share data about you. We do not
              control these third-party websites and are not responsible for their privacy statements.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              9. Children's Privacy
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you are a parent or guardian and you are aware that your child has
              provided us with personal data, please contact us.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              10. Changes to This Privacy Policy
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              11. Contact Us
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us through
              our Contact page.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default PrivacyPage

