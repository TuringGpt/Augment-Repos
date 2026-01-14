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

/**
 * Product Category Detail API Response
 * Backend's ProductCategoryDetailSerializer uses fields="__all__" which returns
 * image as a UUID string instead of a nested FileAPI object.
 * This type is used for PATCH responses from the category update endpoint.
 */
export interface ProductCategoryDetailAPI {
  id: string
  name: string
  slug: string
  description: string
  parent: string | null
  image: string | null // UUID string, not FileAPI object
  created_by: string // UUID string
  created_at: string
  updated_at: string
  is_deleted: boolean
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
 * Recommended Products API Response
 * Same structure as PaginatedProductsAPI but with expanded brand and category objects
 */
export interface RecommendedProductsAPI {
  count: number
  next: string | null
  previous: string | null
  results: RecommendedProductAPI[]
}

/**
 * Recommended Product with expanded brand and category
 */
export interface RecommendedProductAPI {
  id: string
  name: string
  description: string
  price: string // Django returns Decimal as string
  brand: ProductBrandAPI
  category: ProductCategoryAPI
  quantity: number
  rating: string // Django returns Decimal as string
  images: FileAPI[]
}

/**
 * Create Product Request
 * Backend expects snake_case fields for creating a product
 * Based on CreateProductSerializer which has fields: name, description, price, brand, category, quantity, images
 * Note: created_by is automatically set by the backend from the authenticated user
 */
export interface CreateProductRequest {
  name: string
  description: string
  price: string | number // Accept both string and number, will convert to string
  brand: string // Brand UUID
  category: string // Category UUID
  quantity: number
  images?: string[] // Array of image file UUIDs (optional)
}

/**
 * Create Product Response
 * Backend CreateProductSerializer returns only basic fields without timestamps or nested objects
 * Fields: id, name, description, price, brand (UUID), category (UUID), quantity, rating, images (UUID array)
 *
 * Note: This is different from ProductDetailAPI which includes timestamps and nested objects.
 * The CreateProductSerializer doesn't include created_at, updated_at, is_deleted, or created_by,
 * and brand/category/images are just UUIDs, not expanded nested objects.
 */
export interface CreateProductResponseAPI {
  id: string
  name: string
  description: string
  price: string // Django returns Decimal as string
  brand: string // Brand UUID (not expanded)
  category: string // Category UUID (not expanded)
  quantity: number
  rating: string // Django returns Decimal as string
  images: string[] // Array of image file UUIDs (not expanded FileAPI objects)
}

/**
 * Update Product Request
 * Backend expects snake_case fields for updating a product
 * All fields are optional for partial updates (PATCH)
 *
 * Note: The backend ProductDetailSerializer marks brand, category, and images as read_only,
 * so these fields cannot be updated via PATCH requests to ProductUpdateDeleteView.
 * Only the following fields are writable: name, description, price, quantity, rating
 */
export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: string | number // Accept both string and number, will convert to string
  quantity?: number
  rating?: string | number // Accept both string and number, will convert to string
}

/**
 * Update Category Request
 * Backend expects fields for updating a category
 * All fields are optional for partial updates (PATCH)
 * Based on ProductCategoryDetailSerializer which allows updating all fields
 */
export interface UpdateCategoryRequest {
  name?: string
  slug?: string
  description?: string
  parent?: string | null // Parent category UUID or null
  image?: string | null // Image file UUID or null
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
 * Handles ProductCategoryAPI from list endpoints (image as FileAPI object)
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
 * Transform backend category detail to frontend category format
 * Handles ProductCategoryDetailAPI from PATCH responses (image as UUID string)
 *
 * IMPORTANT: The backend's ProductCategoryDetailSerializer uses fields="__all__" which returns
 * image as a UUID string instead of a nested FileAPI object with {id, file}.
 *
 * Since Category.image should be an image URL (not a UUID), we always return undefined for the
 * image field. The categoryStore.updateCategory method handles this by:
 * - Refetching categories when image was updated to get the actual URL
 * - Preserving the existing image URL when image was not updated
 */
export function transformCategoryDetailFromAPI(apiCategory: ProductCategoryDetailAPI) {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    slug: apiCategory.slug, // Use slug from response instead of generating from name
    description: apiCategory.description,
    // Always return undefined since we can't use UUID as image URL
    // The store will either refetch to get the URL or preserve the existing URL
    image: undefined,
    parent: apiCategory.parent ?? undefined,
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

/**
 * Transform recommended product from API to frontend format
 * Same as transformProductFromAPI but uses RecommendedProductAPI type
 */
export function transformRecommendedProductFromAPI(apiProduct: RecommendedProductAPI) {
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
      parent: apiProduct.category.parent || undefined,
    },
    stock: apiProduct.quantity,
    rating: parseFloat(apiProduct.rating),
    reviewCount: 0, // Backend doesn't have review count yet
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
