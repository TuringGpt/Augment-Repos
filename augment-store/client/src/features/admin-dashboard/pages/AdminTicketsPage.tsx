import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Drawer,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from '@mui/material'
import {
  ConfirmationNumber as TicketIcon,
  AccessTime as AccessTimeIcon,
  Flag as StatusIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import { Trans } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useTranslation } from '@hooks/useTranslation'
import { useToast } from '@hooks/useToast'
import { useAuthStore } from '@store/authStore'
import { useTicketStore } from '@store/ticketStore'
import type { TicketStatus, TicketPriority, TicketListItem } from '@features/support/types'
import { escapeHtml } from '@utils/validators'
import { ROUTES } from '@constants/index'

// Form values interface
interface CreateTicketFormValues {
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
}

/**
 * Translate error codes to user-friendly messages
 * Maps error codes to translation keys
 */
const translateErrorCode = (errorCode: string, translateFn: TFunction): string => {
  const errorKeyMap: Partial<Record<string, 'admin.createTicketPage.errorMessage'>> = {
    'TICKET_CREATE_ERROR': 'admin.createTicketPage.errorMessage',
  }

  // If error code matches a known key, translate it
  const translationKey = errorKeyMap[errorCode]
  if (translationKey) {
    return translateFn(translationKey)
  }

  // Otherwise, return the error code as-is (fallback for unknown codes)
  return errorCode
}

/**
 * AdminTicketsPage Component
 * Admin page for viewing ticket statistics and table
 *
 * Note: This component uses defense-in-depth for access control:
 * 1. Primary enforcement: AdminRoute guard redirects non-admin users to home
 * 2. Secondary enforcement: Component-level checks render login/access-denied states
 *    (These provide graceful fallback UI in case the component is rendered outside the guard)
 */
const AdminTicketsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { user, isAuthenticated, hasHydrated, isLoading: authLoading } = useAuthStore()

  const {
    tickets,
    page,
    totalPages,
    pendingPage,
    isLoading: ticketsLoading,
    error: ticketsError,
    fetchTickets,
    setPage,
    stats,
    isFetchingStats,
    statsError,
    getTicketStats,
    createTicket,
    isCreating,
    createError,
    clearCreateError,
    deleteTicket,
    isDeleting,
  } = useTicketStore()

  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const redirectTimeoutRef = useRef<number | null>(null)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<TicketListItem | null>(null)

  // Validation schema with translations - memoized to update when language changes
  const createTicketSchema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(5, t('admin.createTicketPage.validation.titleMinLength'))
          .max(255, t('admin.createTicketPage.validation.titleMaxLength')),
        description: z
          .string()
          .min(20, t('admin.createTicketPage.validation.descriptionMinLength'))
          .max(2000, t('admin.createTicketPage.validation.descriptionMaxLength')),
        priority: z.enum(['low', 'medium', 'high', 'urgent']),
        status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
      }),
    [t]
  )

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      priority: 'medium' as TicketPriority,
      status: 'open' as TicketStatus,
    },
    // Use a validation function that references the memoized schema
    // This ensures validation messages always match the active locale
    validate: (values) => zodResolver(createTicketSchema)(values),
  })

  // Cleanup timeout on unmount to prevent navigation after component is unmounted
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current != null) {
        clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
    }
  }, [])

  // Load tickets on mount and when filters change
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchTickets({
        page: 1,
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery,
      })
    }
  }, [isAuthenticated, user?.role, statusFilter, priorityFilter, searchQuery, fetchTickets])

  // Load ticket stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      if (isAuthenticated && user?.role === 'admin') {
        try {
          await getTicketStats()
        } catch (err) {
          // Error is already handled by the store
          console.error('Failed to fetch ticket stats:', err)
        }
      }
    }

    fetchStats()
  }, [isAuthenticated, user?.role, getTicketStats])

  // Helper functions for formatting
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'info'
      case 'in_progress':
        return 'warning'
      case 'resolved':
        return 'success'
      case 'closed':
        return 'default'
      default:
        return 'default'
    }
  }

  // Helper function to format stat values
  // Shows loading state, error state, or actual value
  const formatStatValue = (value: number | undefined): string | number => {
    // Check error state first - if there's an error, stats will be null but we should show N/A, not loading
    if (statsError) return t('admin.ticketDetailPage.notAvailable')
    // Treat null stats (not yet fetched) or actively fetching as loading state to avoid showing misleading zeros
    if (stats === null || isFetchingStats) return '...'
    return value ?? 0
  }

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  const formatStatus = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return t('admin.ticketsPage.statusOpen')
      case 'in_progress':
        return t('admin.ticketsPage.statusInProgress')
      case 'resolved':
        return t('admin.ticketsPage.statusResolved')
      case 'closed':
        return t('admin.ticketsPage.statusClosed')
      default:
        return status
    }
  }

  const formatPriority = (priority: TicketPriority) => {
    switch (priority) {
      case 'low':
        return t('admin.ticketsPage.priorityLow')
      case 'medium':
        return t('admin.ticketsPage.priorityMedium')
      case 'high':
        return t('admin.ticketsPage.priorityHigh')
      case 'urgent':
        return t('admin.ticketsPage.priorityUrgent')
      default:
        return priority
    }
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const handleTicketClick = (ticketId: string) => {
    navigate(ROUTES.SUPPORT_TICKET_DETAIL.replace(':id', ticketId))
  }

  // Delete handlers
  const handleDeleteClick = (event: React.MouseEvent, ticket: TicketListItem) => {
    // Stop propagation to prevent row click navigation
    event.stopPropagation()
    setTicketToDelete(ticket)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCancel = () => {
    // Prevent closing dialog during deletion
    if (isDeleting) return

    setDeleteDialogOpen(false)
    setTicketToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return

    try {
      // Call the store action to delete the ticket
      await deleteTicket(ticketToDelete.id)

      // Show success message
      toast.success(t('admin.ticketsPage.deleteSuccess'))

      // Close dialog
      setDeleteDialogOpen(false)
      setTicketToDelete(null)
    } catch (err) {
      console.error('Failed to delete ticket:', err)
      toast.error(t('admin.ticketsPage.deleteError'))
      // Keep dialog open on error so user can retry or cancel
    }
  }

  // Create drawer handlers
  const handleOpenCreateDrawer = () => {
    form.reset()
    setSuccessMessage(null)
    setAuthError(null)
    clearCreateError() // Clear any stale error from previous failed attempts
    setIsCreateDrawerOpen(true)
  }

  const handleCloseCreateDrawer = () => {
    // Clear any pending redirect timeout to prevent navigation after drawer is closed
    if (redirectTimeoutRef.current != null) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }
    setIsCreateDrawerOpen(false)
    form.reset()
    setSuccessMessage(null)
    setAuthError(null)
    clearCreateError() // Clear any error when closing the drawer
  }

  const handleCreateTicket = async (values: CreateTicketFormValues) => {
    // Clear any existing timeout at the start to prevent stale redirects
    if (redirectTimeoutRef.current != null) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }

    setSuccessMessage(null)
    setAuthError(null)

    // Wait for hydration to complete before checking authentication
    // This prevents incorrectly treating authenticated users as unauthenticated
    // during the initial hydration or transient loading states
    if (!hasHydrated || authLoading) {
      // Show a loading message to provide user feedback during hydration
      // This avoids the form appearing to do nothing when submitted during initialization
      setAuthError(t('admin.createTicketPage.loadingAuthState'))
      return
    }

    // Ensure user is authenticated before creating ticket
    if (!isAuthenticated || !user?.id) {
      // Show authentication error message and redirect to login page
      setAuthError(t('admin.createTicketPage.authenticationError'))
      redirectTimeoutRef.current = setTimeout(() => {
        navigate(ROUTES.LOGIN)
      }, 2000)
      return
    }

    try {
      const ticket = await createTicket({
        title: values.title,
        description: values.description,
        priority: values.priority as TicketPriority,
        status: values.status as TicketStatus,
        assignee: user.id, // Required by backend - Ticket.assignee is a non-null ForeignKey
      })

      setSuccessMessage(t('admin.createTicketPage.successMessage'))
      form.reset()

      // Redirect to ticket detail page after 1.5 seconds
      redirectTimeoutRef.current = setTimeout(() => {
        handleCloseCreateDrawer()
        navigate(ROUTES.SUPPORT_TICKET_DETAIL.replace(':id', ticket.id))
      }, 1500)
    } catch (err) {
      console.error('Failed to create ticket:', err)
      // Error is already handled by the store
    }
  }

  // Wait for persisted state to rehydrate before checking auth state
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
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TicketIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('admin.ticketsPage.title')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDrawer}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
            }}
          >
            {t('admin.createTicketPage.createTicket')}
          </Button>
        </Box>
        <Typography color="text.secondary">
          {t('admin.ticketsPage.subtitle')}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Tickets */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.totalTickets')}
                </Typography>
                <TicketIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatStatValue(stats?.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Open Tickets */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.openTickets')}
                </Typography>
                <PendingIcon sx={{ color: 'info.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatStatValue(stats?.open)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* In Progress */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.inProgress')}
                </Typography>
                <StatusIcon sx={{ color: 'warning.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatStatValue(stats?.in_progress)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Resolved */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.resolved')}
                </Typography>
                <ResolvedIcon sx={{ color: 'success.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatStatValue(stats?.resolved)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Closed Tickets */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.statusClosed')}
                </Typography>
                <ResolvedIcon sx={{ color: 'text.secondary', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {formatStatValue(stats?.closed)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Avg Response Time */}
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.ticketsPage.stats.avgResponseTime')}
                </Typography>
                <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                N/A
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder={t('admin.ticketsPage.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 250 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>{t('admin.ticketsPage.status')}</InputLabel>
          <Select
            value={statusFilter}
            label={t('admin.ticketsPage.status')}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
          >
            <MenuItem value="">{t('admin.ticketsPage.all')}</MenuItem>
            <MenuItem value="open">{t('admin.ticketsPage.statusOpen')}</MenuItem>
            <MenuItem value="in_progress">{t('admin.ticketsPage.statusInProgress')}</MenuItem>
            <MenuItem value="resolved">{t('admin.ticketsPage.statusResolved')}</MenuItem>
            <MenuItem value="closed">{t('admin.ticketsPage.statusClosed')}</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>{t('admin.ticketsPage.priority')}</InputLabel>
          <Select
            value={priorityFilter}
            label={t('admin.ticketsPage.priority')}
            onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | '')}
          >
            <MenuItem value="">{t('admin.ticketsPage.all')}</MenuItem>
            <MenuItem value="low">{t('admin.ticketsPage.priorityLow')}</MenuItem>
            <MenuItem value="medium">{t('admin.ticketsPage.priorityMedium')}</MenuItem>
            <MenuItem value="high">{t('admin.ticketsPage.priorityHigh')}</MenuItem>
            <MenuItem value="urgent">{t('admin.ticketsPage.priorityUrgent')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tickets Table */}
      {ticketsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : ticketsError ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h6">
            {ticketsError}
          </Typography>
          <Button
            onClick={() =>
              fetchTickets({
                page: pendingPage,
                status: statusFilter,
                priority: priorityFilter,
                search: searchQuery,
              })
            }
            sx={{ mt: 2 }}
          >
            {t('common.retry')}
          </Button>
        </Paper>
      ) : tickets.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <TicketIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery || statusFilter || priorityFilter
              ? t('admin.ticketsPage.noTicketsFound')
              : t('admin.ticketsPage.noTickets')}
          </Typography>
          <Typography color="text.secondary">
            {searchQuery || statusFilter || priorityFilter
              ? t('admin.ticketsPage.tryAdjustingFilters')
              : t('admin.ticketsPage.noTicketsCreated')}
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell>
                    <Typography fontWeight="bold">{t('admin.ticketsPage.table.title')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">{t('admin.ticketsPage.table.status')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">{t('admin.ticketsPage.table.priority')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">{t('admin.ticketsPage.table.reporter')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">{t('admin.ticketsPage.table.assignee')}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold">{t('admin.ticketsPage.table.actions')}</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    hover
                    onClick={() => handleTicketClick(ticket.id)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight="medium">{ticket.title}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {ticket.description.substring(0, 60)}
                        {ticket.description.length > 60 ? '...' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(ticket.status)}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatPriority(ticket.priority)}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ticket.reporter}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ticket.assignee || t('admin.ticketsPage.unassigned')}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('admin.ticketsPage.deleteTicket')}>
                        <IconButton
                          onClick={(e) => handleDeleteClick(e, ticket)}
                          color="error"
                          size="small"
                          disabled={isDeleting}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Create Ticket Drawer */}
      <Drawer
        anchor="right"
        open={isCreateDrawerOpen}
        onClose={handleCloseCreateDrawer}
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
              {t('admin.createTicketPage.createTicket')}
            </Typography>
            <IconButton
              onClick={handleCloseCreateDrawer}
              sx={{ color: 'white' }}
              aria-label="Close create ticket drawer"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {authError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {authError}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {successMessage}
              </Alert>
            )}

            {createError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {translateErrorCode(createError, t)}
              </Alert>
            )}

            <form id="create-ticket-form" onSubmit={form.onSubmit(handleCreateTicket)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label={t('admin.createTicketPage.titleLabel')}
                  placeholder={t('admin.createTicketPage.titlePlaceholder')}
                  required
                  fullWidth
                  {...form.getInputProps('title')}
                  error={!!form.errors.title}
                  helperText={form.errors.title}
                  disabled={isCreating || !hasHydrated || authLoading}
                />

                <TextField
                  label={t('admin.createTicketPage.descriptionLabel')}
                  placeholder={t('admin.createTicketPage.descriptionPlaceholder')}
                  required
                  fullWidth
                  multiline
                  rows={6}
                  {...form.getInputProps('description')}
                  error={!!form.errors.description}
                  helperText={form.errors.description}
                  disabled={isCreating || !hasHydrated || authLoading}
                />

                <FormControl fullWidth required disabled={isCreating || !hasHydrated || authLoading}>
                  <InputLabel id="priority-label">{t('admin.createTicketPage.priorityLabel')}</InputLabel>
                  <Select
                    labelId="priority-label"
                    id="priority-select"
                    label={t('admin.createTicketPage.priorityLabel')}
                    {...form.getInputProps('priority')}
                  >
                    <MenuItem value="low">{t('admin.ticketsPage.priorityLow')}</MenuItem>
                    <MenuItem value="medium">{t('admin.ticketsPage.priorityMedium')}</MenuItem>
                    <MenuItem value="high">{t('admin.ticketsPage.priorityHigh')}</MenuItem>
                    <MenuItem value="urgent">{t('admin.ticketsPage.priorityUrgent')}</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth required disabled={isCreating || !hasHydrated || authLoading}>
                  <InputLabel id="status-label">{t('admin.createTicketPage.statusLabel')}</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status-select"
                    label={t('admin.createTicketPage.statusLabel')}
                    {...form.getInputProps('status')}
                  >
                    <MenuItem value="open">{t('admin.ticketsPage.statusOpen')}</MenuItem>
                    <MenuItem value="in_progress">{t('admin.ticketsPage.statusInProgress')}</MenuItem>
                    <MenuItem value="resolved">{t('admin.ticketsPage.statusResolved')}</MenuItem>
                    <MenuItem value="closed">{t('admin.ticketsPage.statusClosed')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </form>
          </Box>

          {/* Footer Actions */}
          <Divider />
          <Box
            sx={{
              p: 2,
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="outlined"
              onClick={handleCloseCreateDrawer}
              disabled={isCreating || !hasHydrated || authLoading}
            >
              {t('admin.createTicketPage.cancel')}
            </Button>
            <Button
              type="submit"
              form="create-ticket-form"
              variant="contained"
              startIcon={isCreating ? <CircularProgress size={20} /> : <SendIcon />}
              disabled={isCreating || !hasHydrated || authLoading}
            >
              {isCreating ? t('admin.createTicketPage.creating') : t('admin.createTicketPage.createTicket')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-ticket-dialog-title"
        aria-describedby="delete-ticket-dialog-description"
      >
        <DialogTitle id="delete-ticket-dialog-title">
          {t('admin.ticketsPage.deleteTicket')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-ticket-dialog-description">
            <Trans
              i18nKey="admin.ticketsPage.deleteTicketConfirm"
              values={{ ticketTitle: ticketToDelete?.title ? escapeHtml(ticketToDelete.title) : '' }}
              components={{ strong: <strong /> }}
            />
          </DialogContentText>
          <DialogContentText sx={{ mt: 1, color: 'error.main' }}>
            {t('admin.ticketsPage.deleteTicketWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary" disabled={isDeleting} autoFocus>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? t('admin.ticketsPage.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AdminTicketsPage
