import type { CartAPI, Cart, CartItemAPI, CartItem } from '@features/cart/types'

/**
 * Transforms a cart item from API format (snake_case) to frontend format (camelCase)
 * and calculates price and subtotal
 * 
 * @param apiItem - Cart item from API
 * @returns Transformed cart item for frontend
 */
export function transformCartItem(apiItem: CartItemAPI): CartItem {
  const price = parseFloat(apiItem.product.price.toString())
  const quantity = apiItem.quantity
  const subtotal = price * quantity

  return {
    id: apiItem.id,
    product: apiItem.product,
    quantity: quantity,
    price: price,
    subtotal: subtotal,
    createdAt: apiItem.created_at,
    updatedAt: apiItem.updated_at,
  }
}

/**
 * Transforms a cart from API format to frontend format
 * Calculates totals (subtotal, tax, shipping, total, itemCount)
 * 
 * @param apiCart - Cart from API
 * @returns Transformed cart for frontend with calculated totals
 */
export function transformCart(apiCart: CartAPI): Cart {
  // Transform cart items
  const items = apiCart.items
    .filter((item) => !item.is_deleted) // Filter out deleted items
    .map(transformCartItem)

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const tax = subtotal * 0.1 // 10% tax rate
  const shipping = subtotal > 50 ? 0 : 5.99 // Free shipping over $50
  const total = subtotal + tax + shipping

  return {
    id: apiCart.id,
    items: items,
    subtotal: subtotal,
    tax: tax,
    shipping: shipping,
    total: total,
    itemCount: itemCount,
    createdAt: apiCart.created_at,
    updatedAt: apiCart.updated_at,
    user: apiCart.user,
  }
}

/**
 * Creates an empty cart
 * 
 * @returns Empty cart object
 */
export function createEmptyCart(): Cart {
  return {
    id: 'cart-' + Date.now(),
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    itemCount: 0,
  }
}

