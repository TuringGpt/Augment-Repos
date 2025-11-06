export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  comment: string
  createdAt: string
  helpful: number
  verified: boolean
}

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
  reviews?: Review[]
  createdAt: string
  updatedAt: string
  quantity?: number
}

export interface Category {
  id: string
  name: string
  slug?: string
  description?: string
  image?: string
  parent?: string | null
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

export interface CategoryAPIResponse {
  count: number
  next: string | null
  previous: string | null
  results: Category[]
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
