import { useState, useEffect, SyntheticEvent } from 'react'
import { Box, Typography, Slider } from '@mui/material'

interface PriceRangeFilterProps {
  minPrice: number
  maxPrice: number
  value: [number, number]
  onChange: (value: [number, number]) => void
}

const PriceRangeFilter = ({ minPrice, maxPrice, value, onChange }: PriceRangeFilterProps) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value)

  // Update local value when prop changes (e.g., reset filters)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setLocalValue(newValue as [number, number])
  }

  const handleChangeCommitted = (_event: Event | SyntheticEvent, newValue: number | number[]) => {
    onChange(newValue as [number, number])
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        Price Range
      </Typography>
      <Box sx={{ px: 2, py: 1 }}>
        <Slider
          value={localValue}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `$${value}`}
          min={minPrice}
          max={maxPrice}
          step={1}
          disableSwap
          sx={{
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
              },
              '&.Mui-active': {
                boxShadow: '0 0 0 14px rgba(25, 118, 210, 0.16)',
              },
            },
            '& .MuiSlider-track': {
              height: 4,
            },
            '& .MuiSlider-rail': {
              height: 4,
              opacity: 0.3,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            ${localValue[0].toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            ${localValue[1].toFixed(2)}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default PriceRangeFilter
