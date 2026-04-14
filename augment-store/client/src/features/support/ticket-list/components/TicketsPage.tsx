import { useState, useEffect } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Typography,
  Button,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  ConfirmationNumber as TicketIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import type { TicketStatus, TicketPriority, TicketListItem } from '@features/support/types'
import { ROUTES } from '@constants/index'
import { useTicketStore } from '@store/ticketStore'
import { useAuthStore } from '@store/authStore'
import { useToast } from '@hooks/useToast'
import { useTranslation } from '@hooks/useTranslation'

const TicketsPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { t } = useTranslation()

  // Use auth store to check if user is admin
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  // Use ticket store
  const {
    tickets,
    page,
    pendingPage,
    totalPages,
    isLoading,
    error,
    fetchTickets,
    setPage: setStorePage,
    deleteTicket,
    isDeleting,
  } = useTicketStore()

  // Filter states
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<TicketListItem | null>(null)

  // Load tickets on mount and when filters change
  useEffect(() => {
    fetchTickets({
      page: 1,
      status: statusFilter,
      priority: priorityFilter,
      search: searchQuery,
    })
  }, [statusFilter, priorityFilter, searchQuery, fetchTickets])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setStorePage(value)
  }

  const handleCreateTicket = () => {
    navigate(ROUTES.SUPPORT_CREATE)
  }

  const handleTicketClick = (ticketId: string) => {
    navigate(ROUTES.SUPPORT_TICKET_DETAIL.replace(':id', ticketId))
  }

  const handleRetry = () => {
    fetchTickets({
      page: pendingPage,
      status: statusFilter,
      priority: priorityFilter,
      search: searchQuery,
    })
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
    return status.replace('_', ' ').toUpperCase()
  }

  const formatPriority = (priority: TicketPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TicketIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Support Tickets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTicket}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
          }}
        >
          Create Ticket
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search tickets..."
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
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | '')}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Button onClick={handleRetry} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Paper>
      ) : tickets.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <TicketIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tickets found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create your first support ticket to get started
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTicket}>
            Create Ticket
          </Button>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell>
                    <Typography fontWeight="bold">Title</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">Status</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">Priority</Typography>
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="center">
                      <Typography fontWeight="bold">{t('admin.ticketsPage.table.actions')}</Typography>
                    </TableCell>
                  )}
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
                    {isAdmin && (
                      <TableCell align="center">
                        <Tooltip title={t('admin.ticketsPage.deleteTicket')}>
                          <span onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              onClick={(e) => handleDeleteClick(e, ticket)}
                              color="error"
                              size="small"
                              disabled={isDeleting}
                              aria-label={t('admin.ticketsPage.deleteTicket')}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {t('admin.ticketsPage.deleteTicket')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            <span
              dangerouslySetInnerHTML={{
                __html: t('admin.ticketsPage.deleteTicketConfirm', {
                  ticketTitle: ticketToDelete?.title || '',
                }),
              }}
            />
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: 'error.main' }}>
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

export default TicketsPage
