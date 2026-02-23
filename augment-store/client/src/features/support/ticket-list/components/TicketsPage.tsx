import { useState, useEffect, useCallback, useRef } from 'react'
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
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  ConfirmationNumber as TicketIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { ticketService } from '@services/api'
import type { Ticket, TicketStatus, TicketPriority } from '@features/support/types'
import { formatDate } from '@utils/formatters'
import { ROUTES } from '@constants/index'

const TicketsPage = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Request counter to track the latest fetch request
  // Prevents stale responses from overwriting newer state
  const requestCounterRef = useRef(0)

  // Reset page to 1 when filters or search query changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter, priorityFilter, searchQuery])

  const loadTickets = useCallback(async () => {
    // Increment counter and capture the current request ID
    requestCounterRef.current += 1
    const requestId = requestCounterRef.current

    // Capture the current page value at the time of the request
    const currentPage = page

    setIsLoading(true)
    setError(null)

    try {
      const response = await ticketService.getTickets({
        page: currentPage,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchQuery || undefined,
      })

      // Only update state if this is still the latest request
      // This prevents older responses from overwriting newer state
      if (requestId === requestCounterRef.current) {
        setTickets(response.results)

        // Calculate total pages dynamically from response data
        // This handles backend pagination size changes and different environments
        let calculatedTotalPages: number

        if (response.count === 0) {
          // Edge case: empty results should show 1 page (not 0) for pagination UI compatibility
          calculatedTotalPages = 1
        } else if (response.results.length > 0) {
          // Derive page size from actual results length (works for all pages except possibly the last)
          // For the last page, this might underestimate, but we can use the presence of 'next' to refine
          const derivedPageSize = response.results.length

          // If there's a next page, we know we're not on the last page, so use derivedPageSize
          // If there's no next page, we're on the last page, so calculate based on total count
          if (response.next) {
            calculatedTotalPages = Math.ceil(response.count / derivedPageSize)
          } else {
            // On the last page: calculate page size from previous pages
            // totalPages = currentPage, and pageSize = count / (currentPage - 1) for previous pages
            // But simpler: if we're on last page, totalPages = currentPage
            calculatedTotalPages = currentPage
          }
        } else {
          // Fallback: count > 0 but results empty (out-of-range page)
          // We don't know the backend page size, so we can't accurately calculate total pages
          // Instead, set calculatedTotalPages to ensure we trigger a refetch to a valid page
          // Setting it to currentPage - 1 guarantees validPage < currentPage, triggering the refetch
          calculatedTotalPages = Math.max(1, currentPage - 1)
        }

        // Clamp currentPage to valid range [1, totalPages] to prevent invalid pagination state
        // This can happen when requesting an out-of-range page
        const validPage = Math.max(1, Math.min(currentPage, calculatedTotalPages))

        // Update totalPages before potential early return to keep UI state consistent
        setTotalPages(calculatedTotalPages)

        // If the requested page was out of range, refetch the valid page
        if (validPage !== currentPage && calculatedTotalPages > 0) {
          // Update page state and trigger refetch via useEffect
          setPage(validPage)
          return
        }
      }
    } catch (err) {
      // Only update error state if this is still the latest request
      if (requestId === requestCounterRef.current) {
        console.error('Failed to load tickets:', err)
        setError('Failed to load tickets. Please try again.')
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (requestId === requestCounterRef.current) {
        setIsLoading(false)
      }
    }
  }, [page, statusFilter, priorityFilter, searchQuery])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const handleCreateTicket = () => {
    navigate(ROUTES.SUPPORT_CREATE)
  }

  const handleTicketClick = (ticketId: string) => {
    navigate(ROUTES.SUPPORT_TICKET_DETAIL.replace(':id', ticketId))
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
          <Button onClick={loadTickets} sx={{ mt: 2 }}>
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
                  <TableCell>
                    <Typography fontWeight="bold">Created</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">Updated</Typography>
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
                      <Typography variant="body2">{formatDate(ticket.created_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(ticket.updated_at)}</Typography>
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

export default TicketsPage
