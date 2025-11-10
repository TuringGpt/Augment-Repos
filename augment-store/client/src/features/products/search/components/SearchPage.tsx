import { Container, Box, Typography } from '@mui/material'
import SearchBar from '@components/common/SearchBar'

const SearchPage = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Search Products
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <SearchBar placeholder="Search for products..." maxResults={12} />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Start typing to search for products
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search results will appear as you type
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default SearchPage

