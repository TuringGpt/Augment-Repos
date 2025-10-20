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
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
}

export interface ProductSearchParams {
  page?: number
  limit?: number
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price' | 'rating' | 'createdAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}
