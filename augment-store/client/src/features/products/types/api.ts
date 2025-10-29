/**
 * Backend API Types for Products
 * These types match the Django backend response format
 */

export interface ProductBrandAPI {
  id: string
  name: string
  description: string
}

export interface ProductCategoryAPI {
  id: string
  name: string
  description: string
  parent: string | null
  image: string | null
}

export interface ProductAPI {
  id: string
  name: string
  description: string
  price: string // Django returns Decimal as string
  brand: ProductBrandAPI
  category: ProductCategoryAPI
  quantity: number
  rating: string // Django returns Decimal as string
  images: string[] // Array of image URLs (file IDs)
}

/**
 * Paginated response from Django REST Framework
 */
export interface PaginatedProductsAPI {
  count: number
  next: string | null
  previous: string | null
  results: ProductAPI[]
}

/**
 * Transform backend product to frontend product format
 */
export function transformProductFromAPI(apiProduct: ProductAPI) {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description,
    price: parseFloat(apiProduct.price),
    discountPrice: undefined, // Backend doesn't have discount price yet
    images: apiProduct.images.length > 0 ? apiProduct.images : ['/placeholder-product.png'],
    category: {
      id: apiProduct.category.id,
      name: apiProduct.category.name,
      slug: apiProduct.category.name.toLowerCase().replace(/\s+/g, '-'),
      description: apiProduct.category.description,
      image: apiProduct.category.image || undefined,
      parentId: apiProduct.category.parent || undefined,
    },
    stock: apiProduct.quantity,
    rating: parseFloat(apiProduct.rating),
    reviewCount: 0, // Backend doesn't have review count yet
    createdAt: new Date().toISOString(), // Backend doesn't return this in list
    updatedAt: new Date().toISOString(), // Backend doesn't return this in list
  }
}
