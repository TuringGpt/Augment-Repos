import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'

// Dummy contact messages data
const DUMMY_CONTACTS = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    subject: 'Question about product availability',
    message: 'Hi, I would like to know if the wireless headphones are still in stock. I am interested in purchasing 2 units.',
    created_at: '2026-02-18T14:30:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    subject: 'Shipping inquiry',
    message: 'Hello, I placed an order last week and haven\'t received any tracking information yet. Can you please help?',
    created_at: '2026-02-17T10:15:00Z',
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert.j@example.com',
    subject: 'Product return request',
    message: 'I received a damaged item and would like to return it for a refund or replacement. Order number: #12345',
    created_at: '2026-02-16T16:45:00Z',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    subject: 'Partnership opportunity',
    message: 'We are interested in partnering with your company for bulk orders. Please contact us to discuss further.',
    created_at: '2026-02-15T09:20:00Z',
  },
  {
    id: '5',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    subject: 'Technical support needed',
    message: 'I am having trouble setting up my new device. The instructions are unclear. Can someone assist me?',
    created_at: '2026-02-14T13:00:00Z',
  },
]

/**
 * AdminContactMessagesPage Component
 * Admin page for viewing all contact messages submitted by users
 * Currently using dummy data for demonstration purposes
 *
 * Note: Authentication and admin role checks are handled by the AdminRoute guard.
 * This component will only render for authenticated admin users.
 */
const AdminContactMessagesPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuthStore()

  // State for dummy data simulation
  const [isLoading, setIsLoading] = useState(false)
  const [contacts] = useState(DUMMY_CONTACTS)

  // Ref to store the timeout ID for cleanup
  const refreshTimeoutRef = useRef<number | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    // Clear any existing timeout
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current)
    }
    // Simulate loading
    refreshTimeoutRef.current = setTimeout(() => {
      setIsLoading(false)
      refreshTimeoutRef.current = null
    }, 500)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Check if user is authenticated and is an admin
  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('admin.dashboard.pleaseLogin')}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          {t('admin.dashboard.goToLogin')}
        </Button>
      </Container>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('admin.dashboard.accessDenied')}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('admin.dashboard.goToHome')}
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <EmailIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('admin.contactMessagesPage.title')}
            </Typography>
          </Box>
          <Typography color="text.secondary">
            {t('admin.contactMessagesPage.subtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('admin.contactMessagesPage.refresh')}>
          <IconButton onClick={handleRefresh} color="primary" disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Loading State */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : contacts.length > 0 ? (
        /* Contact Messages Table */
        <Box>
          <Paper sx={{ mb: 2, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="body2">
              {t('admin.contactMessagesPage.totalMessages', { count: contacts.length })}
            </Typography>
          </Paper>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('admin.contactMessagesPage.table.name')}</TableCell>
                  <TableCell>{t('admin.contactMessagesPage.table.email')}</TableCell>
                  <TableCell>{t('admin.contactMessagesPage.table.subject')}</TableCell>
                  <TableCell>{t('admin.contactMessagesPage.table.message')}</TableCell>
                  <TableCell>{t('admin.contactMessagesPage.table.date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    {/* Name */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {contact.name}
                      </Typography>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                        }}
                      >
                        {contact.email}
                      </Typography>
                    </TableCell>

                    {/* Subject */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contact.subject}
                      </Typography>
                    </TableCell>

                    {/* Message */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contact.message}
                      </Typography>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <Chip
                        label={formatDate(contact.created_at)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            {t('admin.contactMessagesPage.noMessages')}
          </Typography>
        </Paper>
      )}
    </Container>
  )
}

export default AdminContactMessagesPage

