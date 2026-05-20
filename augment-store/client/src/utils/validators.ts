/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return passwordRegex.test(password)
}

/**
 * Validate phone number
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

/**
 * Validate postal code
 */
export const isValidPostalCode = (postalCode: string, country = 'US'): boolean => {
  if (country === 'US') {
    return /^\d{5}(-\d{4})?$/.test(postalCode)
  }
  // Add more country-specific validations as needed
  return postalCode.length > 0
}

/**
 * Escape HTML special characters to prevent XSS attacks
 *
 * This function should be used when displaying user-generated content
 * in contexts where HTML escaping is disabled (e.g., i18n with escapeValue: false)
 *
 * @param text - The text to escape
 * @returns The escaped text safe for HTML rendering
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export const escapeHtml = (text: string): string => {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char)
}
