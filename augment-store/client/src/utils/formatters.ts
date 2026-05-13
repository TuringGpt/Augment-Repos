/**
 * Format a number or string as currency
 * Accepts both number and string to support exact decimal representations from backend
 */
export const formatCurrency = (amount: number | string, currency = 'USD'): string => {
  const numericAmount: number = typeof amount === 'string' ? parseFloat(amount) : amount
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
