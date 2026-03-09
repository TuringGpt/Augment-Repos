import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
} from '@mui/material'
import {
  ConfirmationNumber as TicketIcon,
  AccessTime as AccessTimeIcon,
  Flag as StatusIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useTranslation } from '@hooks/useTranslation'
import { useAuthStore } from '@store/authStore'
import { useTicketStore } from '@store/ticketStore'
import type { TicketStatus, TicketPriority } from '@features/support/types'
import { ROUTES } from '@constants/index'

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
  const { user, isAuthenticated, hasHydrated, isLoading: authLoading } = useAuthStore()

  // Ticket store
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
    getTicketStats,
  } = useTicketStore()

  // Filter states
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <TicketIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('admin.ticketsPage.title')}
          </Typography>
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
                {isFetchingStats ? '...' : stats?.total ?? 0}
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
                {isFetchingStats ? '...' : stats?.open ?? 0}
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
                {isFetchingStats ? '...' : stats?.in_progress ?? 0}
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
                {isFetchingStats ? '...' : stats?.resolved ?? 0}
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
                <ResolvedIcon sx={{ color: 'default', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {isFetchingStats ? '...' : stats?.closed ?? 0}
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
    </Container>
  )
}

export default AdminTicketsPage
