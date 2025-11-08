import { Box, Rating, Slider, Typography } from '@mui/material'
import { SyntheticEvent, useEffect, useState } from 'react'

interface RatingFilterProps {
  value: [number, number]
  onChange: (value: [number, number]) => void
}

const RatingFilter = ({ value, onChange }: RatingFilterProps) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value)

  // Update local value when prop changes (e.g., reset filters)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setLocalValue(newValue as [number, number])
  }

  const handleChangeCommitted = (_event: Event | SyntheticEvent, newValue: number | number[]) => {
    const newRatingValue = newValue as [number, number]

    // Only trigger onChange if the values are different from current prop values
    if (newRatingValue[0] !== value[0] || newRatingValue[1] !== value[1]) {
      onChange(newRatingValue)
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        Rating Range
      </Typography>
      <Box sx={{ px: 2, py: 1 }}>
        <Slider
          value={localValue}
          onChange={handleChange}
          onChangeCommitted={handleChangeCommitted}
          valueLabelDisplay="auto"
          min={0}
          max={5}
          step={0.5}
          disableSwap
          marks={[
            { value: 0, label: '0' },
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
          ]}
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
            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem',
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={localValue[0]} readOnly precision={0.5} size="small" />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              ({localValue[0]})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={localValue[1]} readOnly precision={0.5} size="small" />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              ({localValue[1]})
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default RatingFilter
