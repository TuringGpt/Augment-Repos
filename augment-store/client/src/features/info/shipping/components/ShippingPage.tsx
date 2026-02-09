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
import { useTranslation } from 'react-i18next'
import { CONTACT_INFO } from '@constants/index'

const ShippingPage = () => {
  const { t } = useTranslation()

  const domesticRates = [
    { method: t('shipping.methods.standard'), time: t('shipping.deliveryTimes.standard'), cost: '$5.99' },
    { method: t('shipping.methods.express'), time: t('shipping.deliveryTimes.express'), cost: '$12.99' },
    { method: t('shipping.methods.overnight'), time: t('shipping.deliveryTimes.overnight'), cost: '$24.99' },
  ]

  const internationalRates = [
    { region: t('shipping.regions.canada'), time: t('shipping.deliveryTimes.canada'), cost: '$15.99' },
    { region: t('shipping.regions.europe'), time: t('shipping.deliveryTimes.europe'), cost: '$29.99' },
    { region: t('shipping.regions.asia'), time: t('shipping.deliveryTimes.asia'), cost: '$29.99' },
    { region: t('shipping.regions.australia'), time: t('shipping.deliveryTimes.australia'), cost: '$34.99' },
    { region: t('shipping.regions.restOfWorld'), time: t('shipping.deliveryTimes.restOfWorld'), cost: '$39.99' },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('shipping.title')}
        </Typography>

        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          {t('shipping.intro')}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {t('shipping.domesticShipping.title')}
          </Typography>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>{t('shipping.table.shippingMethod')}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t('shipping.table.deliveryTime')}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t('shipping.table.cost')}</strong>
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
            {t('shipping.domesticShipping.freeShippingNote')}
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {t('shipping.internationalShipping.title')}
          </Typography>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>{t('shipping.table.region')}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t('shipping.table.deliveryTime')}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t('shipping.table.startingCost')}</strong>
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
            {t('shipping.internationalShipping.customsNote')}
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {t('shipping.orderTracking.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('shipping.orderTracking.paragraph1')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('shipping.orderTracking.paragraph2')}
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {t('shipping.restrictions.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('shipping.restrictions.paragraph1')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('shipping.restrictions.paragraph2')}
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {t('shipping.damagedOrLost.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('shipping.damagedOrLost.paragraph', { supportEmail: CONTACT_INFO.SUPPORT_EMAIL })}
          </Typography>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            {t('shipping.questionsAboutShipping.title')}
          </Typography>
          <Typography variant="body2">
            {t('shipping.questionsAboutShipping.paragraph', {
              supportEmail: CONTACT_INFO.SUPPORT_EMAIL,
              supportPhone: CONTACT_INFO.SUPPORT_PHONE,
            })}
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default ShippingPage
