import { create } from 'zustand'
import type { Product, ProductSearchParams } from '@features/products/types'

interface ProductState {
  products: Product[]
  selectedProduct: Product | null
  searchParams: ProductSearchParams
  isLoading: boolean
  error: string | null
  total: number
  page: number
  totalPages: number
  
  // Actions
  setProducts: (products: Product[], total: number, page: number, totalPages: number) => void
  setSelectedProduct: (product: Product | null) => void
  setSearchParams: (params: Partial<ProductSearchParams>) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearProducts: () => void
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  selectedProduct: null,
  searchParams: {
    page: 1,
    limit: 12,
  },
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 0,

  setProducts: (products, total, page, totalPages) => set({
    products,
    total,
    page,
    totalPages,
  }),
  
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  
  setSearchParams: (params) => set((state) => ({
    searchParams: { ...state.searchParams, ...params },
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearProducts: () => set({
    products: [],
    total: 0,
    page: 1,
    totalPages: 0,
  }),
}))

