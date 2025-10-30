import type { Cart, CartItem } from '@features/cart/types'

/**
 * Gets the price for a cart item
 * Uses discountPrice if available (including 0 for free items), otherwise uses regular price
 *
 * @param item - Cart item
 * @returns Price as a number
 */
export function getItemPrice(item: CartItem): number {
  const price = item.product.discountPrice ?? item.product.price
  return parseFloat(price.toString())
}

/**
 * Gets the subtotal for a cart item (price * quantity)
 *
 * @param item - Cart item
 * @returns Subtotal as a number
 */
export function getItemSubtotal(item: CartItem): number {
  return getItemPrice(item) * item.quantity
}

/**
 * Calculates cart totals from cart items
 *
 * @param items - Array of cart items
 * @returns Object with subtotal, tax, shipping, total, itemCount
 */
export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + getItemSubtotal(item), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const tax = subtotal * 0.1 // 10% tax rate
  const shipping = subtotal > 50 ? 0 : 5.99 // Free shipping over $50
  const total = subtotal + tax + shipping

  return {
    subtotal,
    tax,
    shipping,
    total,
    itemCount,
  }
}

/**
 * Adds calculated totals to a cart
 * Filters out deleted items
 *
 * @param cart - Cart from API
 * @returns Cart with calculated totals
 */
export function enrichCart(cart: Cart): Cart {
  // Filter out deleted items
  const activeItems = cart.items.filter((item) => !item.is_deleted)

  // Calculate totals
  const totals = calculateCartTotals(activeItems)

  return {
    ...cart,
    items: activeItems,
    ...totals,
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_deleted: false,
    user: '',
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    itemCount: 0,
  }
}
