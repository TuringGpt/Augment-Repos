import type {
  Product,
  ProductListResponse,
  ProductSearchParams,
  Category,
} from '@features/products/types'
import dummyProducts from '@data/dummyProducts.json'

export const mockProductService = {
  searchProducts: async (
    query: string,
    params?: ProductSearchParams
  ): Promise<ProductListResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Filter products by query (search in name and description)
    const filteredProducts = (dummyProducts as Product[]).filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
    )

    // Apply limit (default 12 to match real service)
    const limit = params?.limit || 12
    const products = filteredProducts.slice(0, limit)

    return {
      products,
      total: filteredProducts.length,
      page: 1, // Search always returns first page only
      limit,
      totalPages: 1, // Search only shows first page
    }
  },

  getProducts: async (params?: ProductSearchParams): Promise<ProductListResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const limit = params?.limit || 12
    const page = params?.page || 1
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    const products = (dummyProducts as Product[]).slice(startIndex, endIndex)

    return {
      products,
      total: dummyProducts.length,
      page,
      limit,
      totalPages: Math.ceil(dummyProducts.length / limit),
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const product = (dummyProducts as Product[]).find((p) => p.id === id)
    if (!product) {
      throw new Error('Product not found')
    }
    return product
  },

  getCategories: async (): Promise<Category[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Extract unique categories from products
    const categoriesMap = new Map<string, Category>()
    ;(dummyProducts as Product[]).forEach((product) => {
      if (!categoriesMap.has(product.category.id)) {
        categoriesMap.set(product.category.id, product.category)
      }
    })

    return Array.from(categoriesMap.values())
  },

  getFeaturedProducts: async (): Promise<Product[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Return products with discount prices as featured
    return (dummyProducts as Product[]).filter((p) => p.discountPrice).slice(0, 6)
  },
}
