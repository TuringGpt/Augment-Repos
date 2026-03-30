import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'

/**
 * Currency type matching backend ListCurrencySerializer response
 * Backend returns: id, name, code, symbol, created_at, updated_at
 */
export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
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

/**
 * Create Currency Request
 * Backend expects fields for creating a new currency
 */
export interface CreateCurrencyRequest {
  code: string
  name: string
  symbol: string
}

export const currencyService = {
  /**
   * Get all currencies
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise with currency list
   * @throws Error if the API request fails
   */
  getCurrencies: async (signal?: AbortSignal): Promise<Currency[]> => {
    const response = await apiClient.get<CurrencyListResponse>(API_ENDPOINTS.CURRENCY.LIST, {
      signal,
    })
    return response.results
  },

  /**
   * Get a single currency by ID
   * @param id - Currency ID
   * @returns Promise with currency details
   * @throws Error if the API request fails
   */
  getCurrencyById: async (id: string): Promise<Currency> => {
    return apiClient.get<Currency>(API_ENDPOINTS.CURRENCY.DETAIL(id))
  },

  /**
   * Create a new currency
   * @param data - Currency data to create
   * @returns Promise with created currency
   * @throws Error if the API request fails
   */
  createCurrency: async (data: CreateCurrencyRequest): Promise<Currency> => {
    return apiClient.post<Currency>(API_ENDPOINTS.CURRENCY.CREATE, data)
  },
}

