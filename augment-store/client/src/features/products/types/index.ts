export interface Product {
  id: string
  name: string
  description: string
  price: number
  discountPrice?: number
  images: string[]
  category: Category
  stock: number
  rating: number
  reviewCount: number
  specifications?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
}

export interface ProductFilters {
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  maxRating?: number
  inStockOnly?: boolean
}

export type SortBy = 'newest' | 'price-asc' | 'price-desc' | 'rating-desc'

export interface ProductSortOption {
  value: SortBy
  label: string
}

export interface ProductSearchParams {
  page?: number
  limit?: number
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  maxRating?: number
  sortBy?: SortBy
  inStockOnly?: boolean
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}
