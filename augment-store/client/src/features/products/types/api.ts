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
    images: imageUrls.length > 0 ? imageUrls : ['/placeholder-product.png'],
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
