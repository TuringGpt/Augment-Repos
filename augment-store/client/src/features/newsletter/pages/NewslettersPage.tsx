import { useEffect } from 'react'
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material'
import { useNewsletterStore } from '@store/newsletterStore'
import { useTranslation } from '@hooks/useTranslation'

const NewslettersPage = () => {
  const { t } = useTranslation()
  const { newsletters, page, totalPages, isLoading, error, fetchNewsletters, setPage } =
    useNewsletterStore()

  useEffect(() => {
    fetchNewsletters(page)
  }, [page, fetchNewsletters])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  // Map error to user-friendly translated message
  const getErrorMessage = (error: string | null): string => {
    if (!error) return ''

    // If error is our error key, translate it
    if (error === 'NEWSLETTER_FETCH_ERROR') {
      return t('newsletter.errors.fetchFailed')
    }

    // If error contains backend validation messages, display them
    // (parseApiError already extracts user-friendly messages from backend)
    return error
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Newsletter Subscriptions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {getErrorMessage(error)}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'action.hover' }}>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {newsletters.length === 0 ? (
                    <TableRow>
                      <TableCell align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                          No newsletter subscriptions found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    newsletters.map((newsletter, index) => (
                      <TableRow
                        key={index}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2">{newsletter.email}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </>
      )}
    </Container>
  )
}

export default NewslettersPage

