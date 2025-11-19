/**
 * Backend API Types for Products
 * These types match the Django backend response format
 */

/**
 * File object from FileListSerializer
 * Backend returns { id, file } where file is the URL
 */
export interface FileAPI {
  id: string
  file: string | null
}

export interface ProductBrandAPI {
  id: string
  name: string
  description: string
  image: FileAPI | null
}

export interface ProductCategoryAPI {
  id: string
  name: string
  description: string
  parent: string | null
  image: FileAPI | null
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
  images: FileAPI[] // Array of file objects from FileListSerializer
}

/**
 * Product Detail API Response
 * Backend returns all fields including timestamps and nested objects
 */
export interface ProductDetailAPI {
  id: string
  created_at: string
  updated_at: string
  is_deleted: boolean
  name: string
  description: string
  price: string // Django returns Decimal as string
  quantity: number
  rating: string // Django returns Decimal as string
  brand: ProductBrandAPI
  category: ProductCategoryAPI
  created_by: string // UUID string
  images: FileAPI[] // Array of file objects from FileListSerializer
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
 * Placeholder image data URL - a simple gray box
 * Used when products have no images to avoid broken image links
 */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'

/**
 * Transform backend product to frontend product format (for list view)
 */
export function transformProductFromAPI(apiProduct: ProductAPI) {
  // Extract image URLs from FileAPI objects
  const imageUrls = apiProduct.images
    .map((fileObj) => fileObj.file)
    .filter((url): url is string => url !== null)

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description,
    price: parseFloat(apiProduct.price),
    discountPrice: undefined, // Backend doesn't have discount price yet
    images: imageUrls.length > 0 ? imageUrls : [PLACEHOLDER_IMAGE],
    category: {
      id: apiProduct.category.id,
      name: apiProduct.category.name,
      slug: apiProduct.category.name.toLowerCase().replace(/\s+/g, '-'),
      description: apiProduct.category.description,
      image: apiProduct.category.image?.file || undefined,
      parent: apiProduct.category.parent || undefined, // Use 'parent', not 'parentId'
    },
    stock: apiProduct.quantity,
    rating: parseFloat(apiProduct.rating),
    reviewCount: 0, // Backend doesn't have review count yet
    createdAt: new Date().toISOString(), // Backend doesn't return this in list
    updatedAt: new Date().toISOString(), // Backend doesn't return this in list
  }
}

/**
 * Transform backend category to frontend category format
 */
export function transformCategoryFromAPI(apiCategory: ProductCategoryAPI) {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    slug: apiCategory.name.toLowerCase().replace(/\s+/g, '-'),
    description: apiCategory.description,
    image: apiCategory.image?.file || undefined,
    parent: apiCategory.parent || undefined,
  }
}

/**
 * Transform backend brand to frontend brand format
 */
export function transformBrandFromAPI(apiBrand: ProductBrandAPI) {
  return {
    id: apiBrand.id,
    name: apiBrand.name,
    description: apiBrand.description,
    image: apiBrand.image?.file || undefined,
  }
}
