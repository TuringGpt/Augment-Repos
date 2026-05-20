import type { Cart, CartItem, CartItemWithProduct, EnrichedCart } from '@features/cart/types'

/**
 * Gets the price for a cart item
 * Uses discountPrice if available (including 0 for free items), otherwise uses regular price
 *
 * @param item - Cart item
 * @returns Price as a number (0 if product is null)
 */
export function getItemPrice(item: CartItem): number {
  // Return 0 if product is null (deleted product)
  if (!item.product) {
    return 0
  }

  // Use discountPrice if it exists, otherwise fall back to price
  const price = item.product.discountPrice ?? item.product.price

  // Handle both string and number prices from API
  if (typeof price === 'number') {
    return price
  }

  return parseFloat(price)
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
  const shipping = subtotal >= 50 ? 0 : 5.99 // Free shipping at $50 or more
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
 * Filters out deleted items and items with null products (deleted products)
 *
 * @param cart - Cart from API
 * @returns EnrichedCart with calculated totals and items with non-null products
 */
export function enrichCart(cart: Cart): EnrichedCart {
  // Filter out deleted items and items with null products (deleted products)
  // Type guard ensures filtered items have non-null products
  const activeItems = cart.items.filter(
    (item): item is CartItemWithProduct => !item.is_deleted && item.product !== null
  )

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
 * @returns Empty enriched cart object with no items
 */
export function createEmptyCart(): EnrichedCart {
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
