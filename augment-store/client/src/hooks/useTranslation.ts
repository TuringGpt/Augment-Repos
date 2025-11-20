import { useTranslation as useI18nTranslation } from 'react-i18next'

/**
 * Custom hook for translations with type safety
 * Re-exports the useTranslation hook from react-i18next
 * This allows for easier customization in the future if needed
 */
export const useTranslation = () => {
  return useI18nTranslation()
}

export default useTranslation

