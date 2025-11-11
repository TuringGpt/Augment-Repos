import { useState, useEffect } from 'react'
import { Box, Typography, TextField, InputAdornment } from '@mui/material'

interface PriceRangeFilterProps {
  minPrice: number
  maxPrice: number
  value: [number, number]
  onChange: (value: [number, number]) => void
}

const PriceRangeFilter = ({ value, onChange }: PriceRangeFilterProps) => {
  const [localMinPrice, setLocalMinPrice] = useState<string>(value[0].toString())
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(value[1].toString())
  const [minPriceError, setMinPriceError] = useState<string>('')
  const [maxPriceError, setMaxPriceError] = useState<string>('')

  // Update local values when prop changes (e.g., reset filters)
  useEffect(() => {
    setLocalMinPrice(value[0].toString())
    setLocalMaxPrice(value[1].toString())
    setMinPriceError('')
    setMaxPriceError('')
  }, [value])

  const validateAndUpdate = (newMinPrice: string, newMaxPrice: string) => {
    const minVal = parseFloat(newMinPrice)
    const maxVal = parseFloat(newMaxPrice)

    let hasError = false

    // Validate min price
    if (newMinPrice === '' || isNaN(minVal)) {
      setMinPriceError('Please enter a valid price')
      hasError = true
    } else if (minVal < 0) {
      setMinPriceError('Price cannot be negative')
      hasError = true
    } else {
      setMinPriceError('')
    }

    // Validate max price
    if (newMaxPrice === '' || isNaN(maxVal)) {
      setMaxPriceError('Please enter a valid price')
      hasError = true
    } else if (maxVal < 0) {
      setMaxPriceError('Price cannot be negative')
      hasError = true
    } else {
      setMaxPriceError('')
    }

    // Validate min <= max
    if (!hasError && minVal > maxVal) {
      setMinPriceError('Min price cannot be greater than max price')
      hasError = true
    }

    // If no errors, update parent only if values have actually changed from the prop values
    if (!hasError) {
      const currentMin = value[0]
      const currentMax = value[1]

      // Only trigger onChange if the values are different from current prop values
      if (minVal !== currentMin || maxVal !== currentMax) {
        onChange([minVal, maxVal])
      }
    }
  }

  const sanitizeNumericInput = (value: string): string => {
    // Remove invalid characters: e, E, +, -
    // Allow only digits and decimal point
    return value.replace(/[eE+-]/g, '')
  }

  const handleMinPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = sanitizeNumericInput(event.target.value)
    setLocalMinPrice(newValue)
  }

  const handleMaxPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = sanitizeNumericInput(event.target.value)
    setLocalMaxPrice(newValue)
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData('text')

    // Check if pasted text contains invalid characters
    if (/[eE+-]/.test(pastedText)) {
      event.preventDefault()

      const input = event.currentTarget
      const start = input.selectionStart ?? 0
      const end = input.selectionEnd ?? 0
      const currentValue = input.value

      // Sanitize the pasted text
      const sanitized = sanitizeNumericInput(pastedText)

      // Insert sanitized text at cursor position, replacing any selection
      const newValue = currentValue.substring(0, start) + sanitized + currentValue.substring(end)

      // Determine which field and update state
      if (input.name === 'minPrice') {
        setLocalMinPrice(newValue)
      } else if (input.name === 'maxPrice') {
        setLocalMaxPrice(newValue)
      }

      // Set cursor position after the pasted text
      setTimeout(() => {
        input.setSelectionRange(start + sanitized.length, start + sanitized.length)
      }, 0)
    }
  }

  const handleMinPriceBlur = () => {
    validateAndUpdate(localMinPrice, localMaxPrice)
  }

  const handleMaxPriceBlur = () => {
    validateAndUpdate(localMinPrice, localMaxPrice)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent 'e', 'E', '+', '-' from being entered in number input
    if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
      event.preventDefault()
      return
    }

    if (event.key === 'Enter') {
      validateAndUpdate(localMinPrice, localMaxPrice)
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        Price Range
      </Typography>
      <Box sx={{ px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Min Price"
            type="number"
            name="minPrice"
            value={localMinPrice}
            onChange={handleMinPriceChange}
            onBlur={handleMinPriceBlur}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            error={!!minPriceError}
            helperText={minPriceError}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0, step: 0.01 },
            }}
            aria-label="Minimum price"
          />
          <TextField
            label="Max Price"
            type="number"
            name="maxPrice"
            value={localMaxPrice}
            onChange={handleMaxPriceChange}
            onBlur={handleMaxPriceBlur}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            error={!!maxPriceError}
            helperText={maxPriceError}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0, step: 0.01 },
            }}
            aria-label="Maximum price"
          />
        </Box>
      </Box>
    </Box>
  )
}

export default PriceRangeFilter
