import { FormControl, Select, MenuItem, SelectChangeEvent, Box, Typography } from '@mui/material'
import { Sort as SortIcon } from '@mui/icons-material'
import type { SortBy, ProductSortOption } from '@features/products/types'

interface SortDropdownProps {
  value: SortBy
  onChange: (value: SortBy) => void
}

const sortOptions: ProductSortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
]

const SortDropdown = ({ value, onChange }: SortDropdownProps) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as SortBy)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <SortIcon sx={{ color: 'text.secondary' }} />
      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
        Sort by:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <Select
          value={value}
          onChange={handleChange}
          displayEmpty
          sx={{
            '& .MuiSelect-select': {
              py: 1,
            },
          }}
        >
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default SortDropdown

