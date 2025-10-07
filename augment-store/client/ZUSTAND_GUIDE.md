# Zustand State Management Guide

## Overview

This project uses **Zustand** for state management - a small, fast, and scalable state management solution for React.

## Why Zustand?

- ✅ **Simple API** - Easy to learn and use
- ✅ **No Boilerplate** - Minimal setup required
- ✅ **TypeScript Support** - Full type safety
- ✅ **Persistence** - Built-in localStorage support
- ✅ **Performance** - Only re-renders components that use changed state
- ✅ **DevTools** - Works with Redux DevTools

## Store Structure

```
src/store/
├── authStore.ts      # Authentication state
├── cartStore.ts      # Shopping cart state
├── productStore.ts   # Products state
├── uiStore.ts        # UI state (modals, notifications, etc.)
└── index.ts          # Export all stores
```

## Available Stores

### 1. Auth Store (`useAuthStore`)

Manages user authentication state.

**State:**
- `user` - Current user object
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `isAuthenticated` - Boolean authentication status
- `isLoading` - Loading state
- `error` - Error message

**Actions:**
- `setUser(user)` - Set current user
- `setTokens(accessToken, refreshToken)` - Set auth tokens
- `login(user, accessToken, refreshToken)` - Complete login
- `logout()` - Clear auth state
- `setLoading(isLoading)` - Set loading state
- `setError(error)` - Set error message
- `clearError()` - Clear error

**Example Usage:**
```typescript
import { useAuthStore } from '@store/authStore'

function LoginPage() {
  const { login, isLoading, error } = useAuthStore()
  
  const handleLogin = async (credentials) => {
    const response = await authService.login(credentials)
    login(response.user, response.accessToken, response.refreshToken)
  }
  
  return (
    // Your component JSX
  )
}
```

**Persistence:**
Auth state is persisted to localStorage automatically.

---

### 2. Cart Store (`useCartStore`)

Manages shopping cart state.

**State:**
- `cart` - Cart object with items
- `isLoading` - Loading state
- `error` - Error message

**Actions:**
- `setCart(cart)` - Set entire cart
- `addItem(item)` - Add item to cart
- `updateItem(itemId, quantity)` - Update item quantity
- `removeItem(itemId)` - Remove item from cart
- `clearCart()` - Clear all items
- `setLoading(isLoading)` - Set loading state
- `setError(error)` - Set error message

**Computed:**
- `getItemCount()` - Get total number of items
- `getTotal()` - Get cart total amount

**Example Usage:**
```typescript
import { useCartStore } from '@store/cartStore'

function ProductCard({ product }) {
  const { addItem } = useCartStore()
  
  const handleAddToCart = () => {
    addItem({
      id: Date.now().toString(),
      product,
      quantity: 1,
      price: product.price,
      subtotal: product.price,
    })
  }
  
  return (
    <button onClick={handleAddToCart}>Add to Cart</button>
  )
}

function Header() {
  const { getItemCount } = useCartStore()
  const itemCount = getItemCount()
  
  return (
    <Badge badgeContent={itemCount}>
      <ShoppingCart />
    </Badge>
  )
}
```

**Persistence:**
Cart state is persisted to localStorage automatically.

---

### 3. Product Store (`useProductStore`)

Manages products and search state.

**State:**
- `products` - Array of products
- `selectedProduct` - Currently selected product
- `searchParams` - Search/filter parameters
- `isLoading` - Loading state
- `error` - Error message
- `total` - Total number of products
- `page` - Current page
- `totalPages` - Total pages

**Actions:**
- `setProducts(products, total, page, totalPages)` - Set products list
- `setSelectedProduct(product)` - Set selected product
- `setSearchParams(params)` - Update search parameters
- `setLoading(isLoading)` - Set loading state
- `setError(error)` - Set error message
- `clearProducts()` - Clear products list

**Example Usage:**
```typescript
import { useProductStore } from '@store/productStore'

function ProductList() {
  const { products, isLoading, setProducts, setSearchParams } = useProductStore()
  
  useEffect(() => {
    const fetchProducts = async () => {
      const response = await productService.getProducts()
      setProducts(response.products, response.total, response.page, response.totalPages)
    }
    fetchProducts()
  }, [])
  
  return (
    // Your component JSX
  )
}
```

---

### 4. UI Store (`useUIStore`)

Manages UI state like modals, notifications, etc.

**State:**
- `isSidebarOpen` - Sidebar open state
- `isCartDrawerOpen` - Cart drawer open state
- `notifications` - Array of notifications
- `isLoading` - Global loading state

**Actions:**
- `toggleSidebar()` - Toggle sidebar
- `setSidebarOpen(isOpen)` - Set sidebar state
- `toggleCartDrawer()` - Toggle cart drawer
- `setCartDrawerOpen(isOpen)` - Set cart drawer state
- `addNotification(notification)` - Add notification
- `removeNotification(id)` - Remove notification
- `setGlobalLoading(isLoading)` - Set global loading

**Example Usage:**
```typescript
import { useUIStore } from '@store/uiStore'

function App() {
  const { addNotification } = useUIStore()
  
  const showSuccess = () => {
    addNotification({
      type: 'success',
      message: 'Operation completed successfully!',
      duration: 3000,
    })
  }
  
  return (
    // Your component JSX
  )
}
```

---

## Best Practices

### 1. Use Selectors for Performance

Only subscribe to the state you need:

```typescript
// ❌ Bad - Re-renders on any auth state change
const authStore = useAuthStore()

// ✅ Good - Only re-renders when user changes
const user = useAuthStore((state) => state.user)
const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
```

### 2. Separate Actions from State

```typescript
// ✅ Good - Destructure only what you need
const { user, isAuthenticated } = useAuthStore()
const { login, logout } = useAuthStore()
```

### 3. Use Computed Values

For derived state, use computed functions:

```typescript
// In store
getItemCount: () => {
  const { cart } = get()
  return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0
}

// In component
const itemCount = useCartStore((state) => state.getItemCount())
```

### 4. Handle Async Operations

```typescript
const fetchProducts = async () => {
  const { setLoading, setProducts, setError } = useProductStore.getState()
  
  setLoading(true)
  setError(null)
  
  try {
    const response = await productService.getProducts()
    setProducts(response.products, response.total, response.page, response.totalPages)
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

### 5. Reset State on Logout

```typescript
const handleLogout = () => {
  useAuthStore.getState().logout()
  useCartStore.getState().clearCart()
  useProductStore.getState().clearProducts()
}
```

## Persistence

Auth and Cart stores use Zustand's `persist` middleware to save state to localStorage.

**Persisted Data:**
- Auth: user, tokens, isAuthenticated
- Cart: cart items

**Not Persisted:**
- Loading states
- Error messages
- UI state

## DevTools Integration

To use Redux DevTools with Zustand:

```typescript
import { devtools } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // ... your state
      }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' }
  )
)
```

## Testing

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@store/authStore'

describe('AuthStore', () => {
  it('should login user', () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.login(mockUser, 'token', 'refresh')
    })
    
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
  })
})
```

## Migration from Other State Management

### From Redux

```typescript
// Redux
const user = useSelector((state) => state.auth.user)
const dispatch = useDispatch()
dispatch(loginAction(user))

// Zustand
const { user, login } = useAuthStore()
login(user, token, refresh)
```

### From Context API

```typescript
// Context
const { user, login } = useAuth()

// Zustand (same API!)
const { user, login } = useAuthStore()
```

## Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Zustand Recipes](https://docs.pmnd.rs/zustand/guides/recipes)

## Summary

Zustand provides a simple, performant, and type-safe way to manage global state in your React application. The stores are organized by domain (auth, cart, products, UI) and provide a clean API for both reading and updating state.

