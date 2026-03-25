import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'

/**
 * Currency type
 */
export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  exchange_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Currency list response
 */
export interface CurrencyListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Currency[]
}

export const currencyService = {
  /**
   * Get all currencies
   * @returns Promise with currency list
   * @throws Error if the API request fails
   */
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await apiClient.get<CurrencyListResponse>(API_ENDPOINTS.CURRENCY.LIST)
    return response.results
  },
}

