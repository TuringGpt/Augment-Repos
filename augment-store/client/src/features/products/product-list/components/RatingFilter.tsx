import { Box, Typography, Slider, Rating } from '@mui/material'

interface RatingFilterProps {
  value: [number, number]
  onChange: (value: [number, number]) => void
}

const RatingFilter = ({ value, onChange }: RatingFilterProps) => {
  const handleChange = (_event: Event, newValue: number | number[]) => {
    onChange(newValue as [number, number])
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        Rating Range
      </Typography>
      <Box sx={{ px: 1 }}>
        <Slider
          value={value}
          onChange={handleChange}
          valueLabelDisplay="auto"
          min={0}
          max={5}
          step={0.5}
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
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem',
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={value[0]} readOnly precision={0.5} size="small" />
            <Typography variant="caption" color="text.secondary">
              ({value[0]})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={value[1]} readOnly precision={0.5} size="small" />
            <Typography variant="caption" color="text.secondary">
              ({value[1]})
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default RatingFilter

