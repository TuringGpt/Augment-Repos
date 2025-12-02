import { useState, useEffect, useRef, useMemo, useCallback, memo, useId } from 'react'
import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  Fade,
  ClickAwayListener,
  IconButton,
} from '@mui/material'
import {
  Search as SearchIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { debounce } from 'lodash'
import { productService } from '@services/api/products/productService'
import type { Product } from '@features/products/types'
import { Colors } from '@config/colors'
import { useSearchHistory } from '@hooks/useSearchHistory'

interface SearchBarProps {
  placeholder?: string
  debounceDelay?: number
  maxResults?: number
  onResultClick?: (product: Product) => void
}

// Static style objects to prevent re-creation
const searchIconStyle = { color: 'action.active' }

// Memoized icon components to prevent re-renders
const SearchIconMemo = memo(() => <SearchIcon sx={searchIconStyle} />)
SearchIconMemo.displayName = 'SearchIconMemo'

const LoadingSpinner = memo(() => <CircularProgress size={20} />)
LoadingSpinner.displayName = 'LoadingSpinner'

const SearchBar = ({
  placeholder = 'Search products...',
  debounceDelay = 500,
  maxResults = 12,
  onResultClick,
}: SearchBarProps) => {
  const navigate = useNavigate()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()

  // Generate unique IDs for this instance to avoid collisions with multiple SearchBars
  const descriptionId = useId()
  const resultsListId = useId()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showClearButton, setShowClearButton] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const latestQueryRef = useRef<string>('')
  const isMountedRef = useRef<boolean>(true)
  const userDismissedRef = useRef<boolean>(false)

  // Debounced search function using useMemo
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        // Store the query that triggered this request
        const requestQuery = query.trim()
        latestQueryRef.current = requestQuery

        if (!requestQuery) {
          setSearchResults([])
          setIsLoading(false)
          setIsOpen(false)
          return
        }

        setIsLoading(true)
        setError(null)

        try {
          const response = await productService.searchProducts(requestQuery, {
            limit: maxResults,
          })

          // Only update results if component is still mounted and this is still the latest query
          if (isMountedRef.current && latestQueryRef.current === requestQuery) {
            setSearchResults(response.products)
            // Only open dropdown if user hasn't explicitly dismissed it
            if (!userDismissedRef.current) {
              setIsOpen(true)
            }
          }
          // Otherwise, discard stale results
        } catch (err) {
          console.error('Search error:', err)
          // Only show error if component is still mounted and this is still the latest query
          if (isMountedRef.current && latestQueryRef.current === requestQuery) {
            setError('Failed to search products')
            setSearchResults([])
            // Only open dropdown if user hasn't explicitly dismissed it
            if (!userDismissedRef.current) {
              setIsOpen(true)
            }
          }
        } finally {
          // Only update loading state if component is still mounted and this is still the latest query
          if (isMountedRef.current && latestQueryRef.current === requestQuery) {
            setIsLoading(false)
          }
        }
      }, debounceDelay),
    [debounceDelay, maxResults]
  )

  // Track mount/unmount state - only runs on mount and unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Cleanup debounce when it changes or on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value
    setSearchQuery(query)

    // Reset user dismissed flag when user starts typing again
    userDismissedRef.current = false

    // Only update showClearButton when transitioning between empty and non-empty
    const shouldShow = query.length > 0
    if (shouldShow !== showClearButton) {
      setShowClearButton(shouldShow)
    }

    // Show history if query is empty, otherwise search
    if (query.trim() === '') {
      setShowHistory(history.length > 0)
      setSearchResults([])
      setIsOpen(history.length > 0)
    } else {
      setShowHistory(false)
      debouncedSearch(query)
    }
  }

  // Handle input focus
  const handleFocus = () => {
    if (searchQuery.trim() === '' && history.length > 0) {
      setShowHistory(true)
      setIsOpen(true)
    }
  }

  // Handle history item click
  const handleHistoryClick = (term: string) => {
    setSearchQuery(term)
    setShowHistory(false)
    userDismissedRef.current = false
    debouncedSearch(term)
  }

  // Handle remove history item
  const handleRemoveHistory = (term: string, event: React.MouseEvent) => {
    event.stopPropagation()
    removeFromHistory(term)
    // If no more history, close the dropdown
    if (history.length <= 1) {
      setShowHistory(false)
      setIsOpen(false)
    }
  }

  // Handle clear all history
  const handleClearHistory = () => {
    clearHistory()
    setShowHistory(false)
    setIsOpen(false)
  }

  // Handle result click
  const handleResultClick = (product: Product) => {
    // Cancel any pending debounced search to prevent stale results
    debouncedSearch.cancel()
    // Reset latest query to prevent in-flight requests from updating state
    latestQueryRef.current = ''

    // Save search query to history
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim())
    }

    if (onResultClick) {
      onResultClick(product)
    } else {
      navigate(`/products/${product.id}`)
    }
    setSearchQuery('')
    setSearchResults([])
    setIsOpen(false)
    setShowHistory(false)
  }

  // Handle clear search - useCallback to prevent re-creating on every render
  const handleClear = useCallback(() => {
    // Cancel any pending debounced search to prevent stale results
    debouncedSearch.cancel()
    setSearchQuery('')
    setShowClearButton(false)
    setSearchResults([])
    setIsOpen(false)
    setShowHistory(false)
    setError(null)
    latestQueryRef.current = ''
    userDismissedRef.current = false
    inputRef.current?.focus()
  }, [debouncedSearch])

  // Handle click away
  const handleClickAway = () => {
    setIsOpen(false)
    setShowHistory(false)
    // Mark that user explicitly dismissed the dropdown
    userDismissedRef.current = true
  }

  // Memoize end adornment to prevent re-renders
  const endAdornment = useMemo(() => {
    if (isLoading) {
      return (
        <InputAdornment position="end">
          <LoadingSpinner />
        </InputAdornment>
      )
    }

    if (showClearButton) {
      return (
        <InputAdornment position="end">
          <IconButton size="small" onClick={handleClear} edge="end" aria-label="clear search">
            <CloseIcon fontSize="small" />
          </IconButton>
        </InputAdornment>
      )
    }

    return null
  }, [isLoading, showClearButton, handleClear])

  // Format price
  const formatPrice = (price: number, discountPrice?: number) => {
    if (discountPrice && discountPrice < price) {
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography
            variant="body2"
            sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
          >
            ${price.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ color: Colors.primary.main, fontWeight: 'bold' }}>
            ${discountPrice.toFixed(2)}
          </Typography>
        </Box>
      )
    }
    return (
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        ${price.toFixed(2)}
      </Typography>
    )
  }

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
        {/* Visually hidden description for screen readers */}
        <Box
          id={descriptionId}
          component="span"
          sx={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Type to search for products. Results will appear below as you type.
        </Box>
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIconMemo />
              </InputAdornment>
            ),
            endAdornment,
          }}
          inputProps={{
            'aria-label': 'Search products',
            'aria-describedby': descriptionId,
            'aria-autocomplete': 'list',
            'aria-controls': isOpen && searchResults.length > 0 ? resultsListId : undefined,
            'aria-expanded': isOpen,
          }}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'divider',
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />

        {/* Search Results Dropdown */}
        {isOpen && (
          <Fade in={isOpen}>
            <Paper
              elevation={8}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                mt: 1,
                maxHeight: 400,
                overflow: 'auto',
                zIndex: 1300,
                borderRadius: 2,
              }}
            >
              {showHistory ? (
                // Show search history
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 2,
                      py: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                      Recent Searches
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleClearHistory}
                      aria-label="Clear history"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <List disablePadding>
                    {history.map((term) => (
                      <ListItem key={term} disablePadding>
                        <ListItemButton
                          onClick={() => handleHistoryClick(term)}
                          sx={{
                            py: 1,
                            px: 2,
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 'auto', mr: 2 }}>
                            <HistoryIcon sx={{ color: 'text.secondary' }} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                {term}
                              </Typography>
                            }
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => handleRemoveHistory(term, e)}
                            aria-label={`Remove ${term} from history`}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : error ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </Box>
              ) : searchResults.length > 0 ? (
                <List disablePadding id={resultsListId} role="listbox">
                  {searchResults.map((product) => (
                    <ListItem key={product.id} disablePadding role="option">
                      <ListItemButton
                        onClick={() => handleResultClick(product)}
                        aria-label={`${product.name}, ${product.discountPrice ? `$${product.discountPrice}` : `$${product.price}`}`}
                        sx={{
                          py: 1.5,
                          px: 2,
                          gap: 2,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 'auto' }}>
                          <Avatar
                            src={product.images?.[0]}
                            alt={product.name}
                            variant="rounded"
                            sx={{ width: 56, height: 56 }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {product.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              {formatPrice(product.price, product.discountPrice)}
                              {product.stock > 0 ? (
                                <Typography
                                  variant="caption"
                                  sx={{ display: 'block', color: 'success.main' }}
                                >
                                  In Stock
                                </Typography>
                              ) : (
                                <Typography
                                  variant="caption"
                                  sx={{ display: 'block', color: 'error.main' }}
                                >
                                  Out of Stock
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No products found
                  </Typography>
                </Box>
              )}
            </Paper>
          </Fade>
        )}
      </Box>
    </ClickAwayListener>
  )
}

export default SearchBar
