import { useState, useEffect, useCallback, ChangeEvent } from 'react'
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
  TablePagination,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material'

// Dummy data matching API format: { count: 123, next: "...", previous: "...", results: [{ email: "..." }] }
const DUMMY_EMAILS = [
  'john.doe@example.com',
  'jane.smith@example.com',
  'bob.johnson@example.com',
  'alice.williams@example.com',
  'charlie.brown@example.com',
  'diana.davis@example.com',
  'edward.miller@example.com',
  'fiona.wilson@example.com',
  'george.moore@example.com',
  'hannah.taylor@example.com',
  'ian.anderson@example.com',
  'julia.thomas@example.com',
  'kevin.jackson@example.com',
  'laura.white@example.com',
  'michael.harris@example.com',
  'sarah.martinez@example.com',
  'david.garcia@example.com',
  'emma.rodriguez@example.com',
  'james.wilson@example.com',
  'olivia.lopez@example.com',
]

interface Newsletter {
  email: string
}

const NewslettersPage = () => {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const totalCount = 123 // Simulating API count field from API response

  // Generate dummy newsletter data - only email as per API response
  const generateDummyNewsletters = (count: number): Newsletter[] => {
    return Array.from({ length: count }, (_, index) => ({
      email: DUMMY_EMAILS[index % DUMMY_EMAILS.length],
    }))
  }

  // Fetch newsletters with dummy data
  const fetchNewsletters = useCallback(
    async (currentPage: number, limit: number) => {
      setIsLoading(true)
      setError(null)
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Generate all dummy data
        const allNewsletters = generateDummyNewsletters(totalCount)

        // Paginate the data
        const startIndex = currentPage * limit
        const endIndex = startIndex + limit
        const paginatedNewsletters = allNewsletters.slice(startIndex, endIndex)

        setNewsletters(paginatedNewsletters)
      } catch (err) {
        setError('Failed to load newsletters. Please try again later.')
        console.error('Error fetching newsletters:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [totalCount]
  )

  useEffect(() => {
    fetchNewsletters(page, rowsPerPage)
  }, [page, rowsPerPage, fetchNewsletters])

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Newsletter Subscriptions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
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
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Container>
  )
}

export default NewslettersPage

