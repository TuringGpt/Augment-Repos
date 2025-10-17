import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
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
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { debounce } from 'lodash'
import { productService } from '@services/api'
import type { Product } from '@features/products/types'
import { Colors } from '@config/colors'

interface SearchBarProps {
  placeholder?: string
  debounceDelay?: number
  maxResults?: number
  onResultClick?: (product: Product) => void
}

// Memoized icon components to prevent re-renders
const SearchIconMemo = memo(() => <SearchIcon sx={{ color: 'action.active' }} />)
SearchIconMemo.displayName = 'SearchIconMemo'

const LoadingSpinner = memo(() => <CircularProgress size={20} />)
LoadingSpinner.displayName = 'LoadingSpinner'

// Separate memoized components for each state to prevent re-renders
const ClearButtonAdornment = memo(({ onClick }: { onClick: () => void }) => (
  <InputAdornment position="end">
    <IconButton size="small" onClick={onClick} edge="end" aria-label="clear search">
      <CloseIcon fontSize="small" />
    </IconButton>
  </InputAdornment>
))
ClearButtonAdornment.displayName = 'ClearButtonAdornment'

const LoadingAdornment = memo(() => (
  <InputAdornment position="end">
    <LoadingSpinner />
  </InputAdornment>
))
LoadingAdornment.displayName = 'LoadingAdornment'

const SearchBar = ({
  placeholder = 'Search products...',
  debounceDelay = 500,
  maxResults = 5,
  onResultClick,
}: SearchBarProps) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasQuery, setHasQuery] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search function using useMemo
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          setSearchResults([])
          setIsLoading(false)
          setIsOpen(false)
          return
        }

        setIsLoading(true)
        setError(null)

        try {
          const response = await productService.searchProducts(query, {
            limit: maxResults,
          })
          setSearchResults(response.products)
          setIsOpen(response.products.length > 0)
        } catch (err) {
          console.error('Search error:', err)
          setError('Failed to search products')
          setSearchResults([])
        } finally {
          setIsLoading(false)
        }
      }, debounceDelay),
    [debounceDelay, maxResults]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value
    setSearchQuery(query)
    setHasQuery(query.length > 0)
    debouncedSearch(query)
  }

  // Handle result click
  const handleResultClick = (product: Product) => {
    if (onResultClick) {
      onResultClick(product)
    } else {
      navigate(`/products/${product.id}`)
    }
    setSearchQuery('')
    setSearchResults([])
    setIsOpen(false)
  }

  // Handle clear search - useCallback to prevent re-creating on every render
  const handleClear = useCallback(() => {
    setSearchQuery('')
    setHasQuery(false)
    setSearchResults([])
    setIsOpen(false)
    setError(null)
    inputRef.current?.focus()
  }, [])

  // Handle click away
  const handleClickAway = () => {
    setIsOpen(false)
  }

  // Memoize InputProps to prevent re-creating endAdornment on every render
  // Only depends on hasQuery (boolean), not searchQuery (string)
  const inputProps = useMemo(
    () => ({
      startAdornment: (
        <InputAdornment position="start">
          <SearchIconMemo />
        </InputAdornment>
      ),
      endAdornment: isLoading ? (
        <LoadingAdornment />
      ) : hasQuery ? (
        <ClearButtonAdornment onClick={handleClear} />
      ) : null,
    }),
    [isLoading, hasQuery, handleClear]
  )

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
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={inputProps}
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
              {error ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </Box>
              ) : searchResults.length > 0 ? (
                <List disablePadding>
                  {searchResults.map((product) => (
                    <ListItem key={product.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleResultClick(product)}
                        sx={{
                          py: 1.5,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={product.images?.[0] || '/placeholder-product.png'}
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
