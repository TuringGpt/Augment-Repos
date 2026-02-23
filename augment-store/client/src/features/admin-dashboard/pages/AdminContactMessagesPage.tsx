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
  Drawer,
  Divider,
  useTheme,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Subject as SubjectIcon,
  Message as MessageIcon,
  AccessTime as AccessTimeIcon,
  MarkEmailRead as MarkEmailReadIcon,
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
    is_read: false,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    subject: 'Shipping inquiry',
    message: 'Hello, I placed an order last week and haven\'t received any tracking information yet. Can you please help?',
    created_at: '2026-02-17T10:15:00Z',
    is_read: true,
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert.j@example.com',
    subject: 'Product return request',
    message: 'I received a damaged item and would like to return it for a refund or replacement. Order number: #12345',
    created_at: '2026-02-16T16:45:00Z',
    is_read: false,
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    subject: 'Partnership opportunity',
    message: 'We are interested in partnering with your company for bulk orders. Please contact us to discuss further.',
    created_at: '2026-02-15T09:20:00Z',
    is_read: true,
  },
  {
    id: '5',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    subject: 'Technical support needed',
    message: 'I am having trouble setting up my new device. The instructions are unclear. Can someone assist me?',
    created_at: '2026-02-14T13:00:00Z',
    is_read: false,
  },
]

/**
 * AdminContactMessagesPage Component
 * Admin page for viewing all contact messages submitted by users
 * Currently using dummy data for demonstration purposes
 *
 * Note: This component uses defense-in-depth for access control:
 * 1. Primary enforcement: AdminRoute guard redirects non-admin users to home
 * 2. Secondary enforcement: Component-level checks render login/access-denied states
 *    (These provide graceful fallback UI in case the component is rendered outside the guard)
 */
const AdminContactMessagesPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const theme = useTheme()
  const { user, isAuthenticated, hasHydrated, isLoading: authLoading } = useAuthStore()

  // State for dummy data simulation
  const [isLoading, setIsLoading] = useState(false)
  const [contacts, setContacts] = useState(DUMMY_CONTACTS)

  // Drawer state
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<typeof DUMMY_CONTACTS[0] | null>(null)

  // Track which contacts are being marked as read
  const [markingAsRead, setMarkingAsRead] = useState<Set<string>>(new Set())

  // Ref to store the timeout IDs for cleanup
  const refreshTimeoutRef = useRef<number | null>(null)
  const drawerCloseTimeoutRef = useRef<number | null>(null)
  const markAsReadTimeoutRef = useRef<number | null>(null)

  // Get the drawer transition duration from theme
  // MUI Drawer uses 'leavingScreen' duration for exit transitions
  const drawerTransitionDuration = theme.transitions.duration.leavingScreen

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (drawerCloseTimeoutRef.current !== null) {
        clearTimeout(drawerCloseTimeoutRef.current)
      }
      if (markAsReadTimeoutRef.current !== null) {
        clearTimeout(markAsReadTimeoutRef.current)
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

  // Drawer handlers
  const handleViewDetails = (contact: typeof DUMMY_CONTACTS[0]) => {
    // Clear any pending close timeout to avoid race condition
    if (drawerCloseTimeoutRef.current !== null) {
      clearTimeout(drawerCloseTimeoutRef.current)
      drawerCloseTimeoutRef.current = null
    }
    setSelectedContact(contact)
    setIsDetailsDrawerOpen(true)
  }

  const handleCloseDetailsDrawer = () => {
    setIsDetailsDrawerOpen(false)
    // Clear any existing timeout
    if (drawerCloseTimeoutRef.current !== null) {
      clearTimeout(drawerCloseTimeoutRef.current)
    }
    // Delay clearing selectedContact until after the drawer close animation completes
    // This prevents the drawer content from disappearing during the transition
    // Use the theme's leavingScreen duration to match the Drawer's exit transition
    drawerCloseTimeoutRef.current = setTimeout(() => {
      setSelectedContact(null)
      drawerCloseTimeoutRef.current = null
    }, drawerTransitionDuration)
  }

  const handleMarkAsRead = async (contactId: string, event: React.MouseEvent) => {
    // Prevent row click event from firing
    event.stopPropagation()

    // Don't mark if already being marked
    if (markingAsRead.has(contactId)) {
      return
    }

    // Add to marking set using functional update to avoid stale closure
    setMarkingAsRead((prev) => {
      const newMarkingAsRead = new Set(prev)
      newMarkingAsRead.add(contactId)
      return newMarkingAsRead
    })

    // Optimistically update the UI
    setContacts((prevContacts) =>
      prevContacts.map((contact) =>
        contact.id === contactId ? { ...contact, is_read: true } : contact
      )
    )

    // Clear any existing timeout
    if (markAsReadTimeoutRef.current !== null) {
      clearTimeout(markAsReadTimeoutRef.current)
    }
    // Simulate API call with timeout (dummy handler)
    markAsReadTimeoutRef.current = setTimeout(() => {
      // Remove from marking set using functional update to avoid stale closure
      setMarkingAsRead((prev) => {
        const finalMarkingAsRead = new Set(prev)
        finalMarkingAsRead.delete(contactId)
        return finalMarkingAsRead
      })
      markAsReadTimeoutRef.current = null
    }, 500)
  }

  // Wait for persisted state to rehydrate before checking auth state
  // This prevents showing misleading "please login" or "access denied" UI
  // during the brief hydration period on initial page load
  if (!hasHydrated || authLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
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
          <span>
            <IconButton
              onClick={handleRefresh}
              color="primary"
              disabled={isLoading}
              aria-label={t('admin.contactMessagesPage.refresh')}
            >
              <RefreshIcon />
            </IconButton>
          </span>
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
                  <TableCell align="center">{t('admin.contactMessagesPage.table.actions')}</TableCell>
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

                    {/* Actions */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title={t('admin.contactMessagesPage.viewDetails')}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(contact)}
                            aria-label={t('admin.contactMessagesPage.viewDetails')}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!contact.is_read && (
                          <Tooltip title={t('admin.contactMessagesPage.markAsRead')}>
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={(e) => handleMarkAsRead(contact.id, e)}
                                disabled={markingAsRead.has(contact.id)}
                                aria-label={t('admin.contactMessagesPage.markAsRead')}
                              >
                                {markingAsRead.has(contact.id) ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <MarkEmailReadIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
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

      {/* Contact Message Details Drawer */}
      <Drawer
        anchor="right"
        open={isDetailsDrawerOpen}
        onClose={handleCloseDetailsDrawer}
        transitionDuration={{
          enter: theme.transitions.duration.enteringScreen,
          exit: theme.transitions.duration.leavingScreen,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 500, md: 600 },
            maxWidth: '100%',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.contactMessagesPage.messageDetails')}
            </Typography>
            <IconButton
              onClick={handleCloseDetailsDrawer}
              sx={{ color: 'white' }}
              aria-label={t('common.close')}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Details Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
            {selectedContact && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Contact Name */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.contactMessagesPage.table.name')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3.5 }}>
                    {selectedContact.name}
                  </Typography>
                </Box>

                <Divider />

                {/* Contact Email */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.contactMessagesPage.table.email')}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      pl: 3.5,
                      fontFamily: 'monospace',
                      fontSize: '0.95rem',
                      color: 'primary.main'
                    }}
                  >
                    {selectedContact.email}
                  </Typography>
                </Box>

                <Divider />

                {/* Subject */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SubjectIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.contactMessagesPage.table.subject')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 3.5, fontWeight: 500 }}>
                    {selectedContact.subject}
                  </Typography>
                </Box>

                <Divider />

                {/* Message */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MessageIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.contactMessagesPage.table.message')}
                    </Typography>
                  </Box>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      ml: 3.5,
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.7
                      }}
                    >
                      {selectedContact.message}
                    </Typography>
                  </Paper>
                </Box>

                <Divider />

                {/* Date */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.contactMessagesPage.table.date')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ pl: 3.5 }}>
                    {formatDate(selectedContact.created_at)}
                  </Typography>
                </Box>

                <Divider />

                {/* Message ID */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {t('admin.contactMessagesPage.table.id')}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      color: 'text.secondary'
                    }}
                  >
                    {selectedContact.id}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Footer Actions */}
          <Divider />
          <Box sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCloseDetailsDrawer}
            >
              {t('common.close')}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  )
}

export default AdminContactMessagesPage

