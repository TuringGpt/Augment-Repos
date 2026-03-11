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
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useContactStore } from '@store/contactStore'
import type { ContactItem } from '@services/api/contact/contactService'



/**
 * AdminContactMessagesPage Component
 * Admin page for viewing all contact messages submitted by users
 * Fetches contact messages from the backend API via the contact store
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

  // Contact store
  const { contacts: contactsData, isLoading, fetchError, getContacts, updateContact } = useContactStore()
  const contacts = contactsData?.results || []

  // Drawer state
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null)

  // Track which contacts are being marked as read
  const [markingAsRead, setMarkingAsRead] = useState<Set<string>>(new Set())
  // Track which contacts are being resolved
  const [markingAsResolved, setMarkingAsResolved] = useState<Set<string>>(new Set())

  // Ref to store the timeout IDs for cleanup
  const refreshTimeoutRef = useRef<number | null>(null)
  const drawerCloseTimeoutRef = useRef<number | null>(null)
  // Track mount state to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true)
  // Ref-based in-flight guard to prevent double-click race conditions
  // Unlike React state, refs update synchronously and can't be bypassed by rapid clicks
  const inFlightUpdatesRef = useRef<Set<string>>(new Set())

  // Get the drawer transition duration from theme
  // MUI Drawer uses 'leavingScreen' duration for exit transitions
  const drawerTransitionDuration = theme.transitions.duration.leavingScreen

  // Fetch contacts only when authenticated and authorized
  // This prevents unnecessary/unauthorized fetches before auth checks complete
  useEffect(() => {
    if (hasHydrated && !authLoading && isAuthenticated && user?.role === 'admin') {
      getContacts()
    }
  }, [hasHydrated, authLoading, isAuthenticated, user?.role, getContacts])

  // Track mount/unmount state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (drawerCloseTimeoutRef.current !== null) {
        clearTimeout(drawerCloseTimeoutRef.current)
      }
    }
  }, [])

  const handleRefresh = () => {
    getContacts()
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Drawer handlers
  const handleViewDetails = async (contact: ContactItem) => {
    // Clear any pending close timeout to avoid race condition
    if (drawerCloseTimeoutRef.current !== null) {
      clearTimeout(drawerCloseTimeoutRef.current)
      drawerCloseTimeoutRef.current = null
    }
    setSelectedContact(contact)
    setIsDetailsDrawerOpen(true)

    // Automatically mark as read when opening the drawer if status is unread
    if (contact.status === 'unread') {
      // Check if update is already in-flight for this contact
      if (inFlightUpdatesRef.current.has(contact.id)) {
        return
      }

      // Mark as in-flight immediately (synchronous update)
      inFlightUpdatesRef.current.add(contact.id)

      // Update React state for UI feedback (asynchronous update)
      setMarkingAsRead((prev) => {
        const newMarkingAsRead = new Set(prev)
        newMarkingAsRead.add(contact.id)
        return newMarkingAsRead
      })

      try {
        // Call the updateContact store action to mark as read
        await updateContact(contact.id, { status: 'read' })
      } catch (error) {
        // Error is already handled by the store, but we catch to prevent unhandled rejection
        console.error('Failed to automatically mark contact as read - check updateError state for details', error)
      } finally {
        // Remove from in-flight set (synchronous update)
        inFlightUpdatesRef.current.delete(contact.id)

        // Only update state if component is still mounted to prevent React warnings
        if (isMountedRef.current) {
          // Remove from marking set using functional update to avoid stale closure
          setMarkingAsRead((prev) => {
            const finalMarkingAsRead = new Set(prev)
            finalMarkingAsRead.delete(contact.id)
            return finalMarkingAsRead
          })
        }
      }
    }
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

    // Ref-based guard: Check if update is already in-flight for this contact
    // This prevents double-click race conditions because refs update synchronously
    // Unlike React state which updates asynchronously and can be bypassed by rapid clicks
    if (inFlightUpdatesRef.current.has(contactId)) {
      return
    }

    // Mark as in-flight immediately (synchronous update)
    inFlightUpdatesRef.current.add(contactId)

    // Also update React state for UI feedback (asynchronous update)
    // Add to marking set using functional update to avoid stale closure
    setMarkingAsRead((prev) => {
      const newMarkingAsRead = new Set(prev)
      newMarkingAsRead.add(contactId)
      return newMarkingAsRead
    })

    try {
      // Call the updateContact store action to mark as read
      await updateContact(contactId, { status: 'read' })
    } catch (error) {
      // Error is already handled by the store, but we catch to prevent unhandled rejection
      // The store will set updateError which could be displayed if needed
      console.error('Failed to mark contact as read - check updateError state for details')
    } finally {
      // Remove from in-flight set (synchronous update)
      inFlightUpdatesRef.current.delete(contactId)

      // Only update state if component is still mounted to prevent React warnings
      if (isMountedRef.current) {
        // Remove from marking set using functional update to avoid stale closure
        setMarkingAsRead((prev) => {
          const finalMarkingAsRead = new Set(prev)
          finalMarkingAsRead.delete(contactId)
          return finalMarkingAsRead
        })
      }
    }
  }

  const handleMarkAsResolved = async (contactId: string, event: React.MouseEvent) => {
    // Prevent row click event from firing
    event.stopPropagation()

    // Ref-based guard: Check if update is already in-flight for this contact
    // This prevents double-click race conditions because refs update synchronously
    // Unlike React state which updates asynchronously and can be bypassed by rapid clicks
    if (inFlightUpdatesRef.current.has(contactId)) {
      return
    }

    // Mark as in-flight immediately (synchronous update)
    inFlightUpdatesRef.current.add(contactId)

    // Also update React state for UI feedback (asynchronous update)
    // Add to marking set using functional update to avoid stale closure
    setMarkingAsResolved((prev) => {
      const newMarkingAsResolved = new Set(prev)
      newMarkingAsResolved.add(contactId)
      return newMarkingAsResolved
    })

    try {
      // Call the updateContact store action to mark as resolved
      await updateContact(contactId, { status: 'resolved' })
    } catch (error) {
      // Error is already handled by the store, but we catch to prevent unhandled rejection
      // The store will set updateError which could be displayed if needed
      console.error('Failed to mark contact as resolved - check updateError state for details')
    } finally {
      // Remove from in-flight set (synchronous update)
      inFlightUpdatesRef.current.delete(contactId)

      // Only update state if component is still mounted to prevent React warnings
      if (isMountedRef.current) {
        // Remove from marking set using functional update to avoid stale closure
        setMarkingAsResolved((prev) => {
          const finalMarkingAsResolved = new Set(prev)
          finalMarkingAsResolved.delete(contactId)
          return finalMarkingAsResolved
        })
      }
    }
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

      {/* Error State */}
      {fetchError ? (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
            >
              {t('admin.contactMessagesPage.retry')}
            </Button>
          }
        >
          {fetchError}
        </Alert>
      ) : /* Loading State - treat null contactsData as initial loading to avoid flicker */
      isLoading || contactsData === null ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : contacts.length > 0 ? (
        /* Contact Messages Table */
        <Box>
          <Paper sx={{ mb: 2, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="body2">
              {t('admin.contactMessagesPage.totalMessages', { count: contactsData?.count ?? 0 })}
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
                  <TableCell>{t('admin.contactMessagesPage.table.status')}</TableCell>
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

                    {/* Status */}
                    <TableCell>
                      <Chip
                        label={contact.status}
                        size="small"
                        color={
                          contact.status === 'unread'
                            ? 'error'
                            : contact.status === 'read'
                            ? 'warning'
                            : 'success'
                        }
                        sx={{
                          fontSize: '0.75rem',
                          textTransform: 'capitalize',
                          minWidth: 80
                        }}
                      />
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
                        {(contact.status === 'unread' || markingAsRead.has(contact.id)) && (
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
                        {(contact.status === 'read' || markingAsResolved.has(contact.id)) && (
                          <Tooltip title={t('admin.contactMessagesPage.markAsResolved')}>
                            <span>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={(e) => handleMarkAsResolved(contact.id, e)}
                                disabled={markingAsResolved.has(contact.id) || markingAsRead.has(contact.id)}
                                aria-label={t('admin.contactMessagesPage.markAsResolved')}
                              >
                                {markingAsResolved.has(contact.id) ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <CheckCircleIcon fontSize="small" />
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

