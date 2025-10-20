import { Box, Typography, Slider } from '@mui/material'

interface PriceRangeFilterProps {
  minPrice: number
  maxPrice: number
  value: [number, number]
  onChange: (value: [number, number]) => void
}

const PriceRangeFilter = ({
  minPrice,
  maxPrice,
  value,
  onChange,
}: PriceRangeFilterProps) => {
  const handleChange = (_event: Event, newValue: number | number[]) => {
    onChange(newValue as [number, number])
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        Price Range
      </Typography>
      <Box sx={{ px: 1 }}>
        <Slider
          value={value}
          onChange={handleChange}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `$${value}`}
          min={minPrice}
          max={maxPrice}
          sx={{
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ${value[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${value[1]}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default PriceRangeFilter

