/**
 * Format a number or string as currency
 * Accepts both number and string to support exact decimal representations from backend
 *
 * @param amount - The amount to format (number or numeric string)
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted currency string, or '$0.00' (or equivalent) for invalid input
 *
 * @example
 * formatCurrency(123.45) // '$123.45'
 * formatCurrency('123.45') // '$123.45'
 * formatCurrency('12abc') // '$0.00' (invalid input)
 * formatCurrency('') // '$0.00' (invalid input)
 */
export const formatCurrency = (amount: number | string, currency = 'USD'): string => {
  let numericAmount: number

  if (typeof amount === 'string') {
    // Validate that the string is fully numeric before parsing
    // Trim whitespace and check if it's a valid number format
    const trimmedAmount = amount.trim()

    // Check if the string is empty or contains non-numeric characters (except decimal point, minus sign, and leading/trailing spaces)
    // This regex ensures the entire string is a valid number (including decimals and negative numbers)
    if (trimmedAmount === '' || !/^-?\d+(\.\d+)?$/.test(trimmedAmount)) {
      console.warn(`formatCurrency: Invalid numeric string "${amount}". Defaulting to 0.`)
      numericAmount = 0
    } else {
      numericAmount = parseFloat(trimmedAmount)

      // Additional check: ensure parseFloat didn't produce NaN
      if (!Number.isFinite(numericAmount)) {
        console.warn(`formatCurrency: Parsing "${amount}" resulted in NaN. Defaulting to 0.`)
        numericAmount = 0
      }
    }
  } else if (typeof amount === 'number') {
    // Validate that the number is finite (not NaN, Infinity, or -Infinity)
    if (!Number.isFinite(amount)) {
      console.warn(`formatCurrency: Invalid number ${amount}. Defaulting to 0.`)
      numericAmount = 0
    } else {
      numericAmount = amount
    }
  } else {
    // Fallback for any other type (should not happen with proper typing)
    console.warn(`formatCurrency: Unexpected type ${typeof amount}. Defaulting to 0.`)
    numericAmount = 0
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  })
  return formatter.format(numericAmount)
}

/**
 * Format a date string
 * Returns 'N/A' if the date is invalid or empty to prevent crashes
 */
export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  // Guard against invalid input
  if (!date || (typeof date === 'string' && date.trim() === '')) {
    return 'N/A'
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check if the parsed date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A'
    }

    if (format === 'long') {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj)
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj)
  } catch (error) {
    // If formatting fails, return a fallback value instead of crashing
    console.warn('Invalid date encountered in formatDate:', date, error)
    return 'N/A'
  }
}

/**
 * Truncate text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
