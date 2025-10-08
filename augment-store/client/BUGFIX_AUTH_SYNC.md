# Bug Fix: Auth Store and API Client Synchronization

## 🚨 CRITICAL ISSUE: Token Storage Mismatch

### Problem Identified

**Location**: `src/services/api/client.ts` and `src/store/authStore.ts`

**Issue**: The API client interceptor was reading tokens from `localStorage` directly, but the auth store (Zustand) was storing tokens in a different location, causing a critical mismatch.

### The Mismatch

#### What Was Happening:

1. **Login Flow**:

   ```typescript
   // User logs in
   useAuthStore.getState().login(user, accessToken, refreshToken)
   // ✅ Zustand store updated
   // ✅ Persisted to localStorage under key 'auth-storage'
   // ❌ But NOT in 'accessToken' and 'refreshToken' keys
   ```

2. **API Request**:

   ```typescript
   // Interceptor tries to add auth header
   const token = localStorage.getItem('accessToken') // ❌ Returns null!
   // No auth header added
   // Request fails with 401
   ```

3. **Logout Flow**:
   ```typescript
   // User logs out
   useAuthStore.getState().logout()
   // ✅ Zustand store cleared
   // ❌ But localStorage 'accessToken' and 'refreshToken' still exist (if they were set)
   // Stale tokens remain
   ```

### Storage Locations

**Zustand Store (with persist middleware)**:

```javascript
localStorage['auth-storage'] = {
  state: {
    user: {...},
    accessToken: "token123",
    refreshToken: "refresh456",
    isAuthenticated: true
  }
}
```

**What API Client Was Reading**:

```javascript
localStorage['accessToken'] // ❌ Doesn't exist!
localStorage['refreshToken'] // ❌ Doesn't exist!
```

---

## ✅ Solution: Use Zustand Store as Single Source of Truth

### Changes Made

#### 1. Import Zustand Store

```typescript
import { useAuthStore } from '@store/authStore'
```

#### 2. Read Token from Zustand Store (Request Interceptor)

**Before (Broken)**:

```typescript
const token = localStorage.getItem('accessToken') // ❌ Wrong location
```

**After (Fixed)**:

```typescript
const token = useAuthStore.getState().accessToken // ✅ Correct source
```

#### 3. Read Refresh Token from Zustand Store (Response Interceptor)

**Before (Broken)**:

```typescript
const refreshToken = localStorage.getItem('refreshToken') // ❌ Wrong location
```

**After (Fixed)**:

```typescript
const refreshToken = useAuthStore.getState().refreshToken // ✅ Correct source
```

#### 4. Update Tokens in Zustand Store After Refresh

**Before (Broken)**:

```typescript
localStorage.setItem('accessToken', accessToken) // ❌ Wrong location
// Zustand store not updated!
```

**After (Fixed)**:

```typescript
useAuthStore.getState().setTokens(accessToken, refreshToken) // ✅ Updates store
// Zustand persist middleware automatically syncs to localStorage
```

#### 5. Logout via Zustand Store (API Client)

**Before (Broken)**:

```typescript
localStorage.removeItem('accessToken')
localStorage.removeItem('refreshToken')
// ❌ Zustand store not updated!
```

**After (Fixed)**:

```typescript
useAuthStore.getState().logout() // ✅ Clears store
// Zustand persist middleware automatically syncs to localStorage
```

#### 6. Logout via Zustand Store (Auth Service)

**Before (Broken)**:

```typescript
// In authService.ts
logout: async (): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  localStorage.removeItem('accessToken') // ❌ Direct localStorage manipulation
  localStorage.removeItem('refreshToken') // ❌ Zustand store not updated!
}
```

**After (Fixed)**:

```typescript
// In authService.ts
logout: async (): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  // Clear auth state from Zustand store (which automatically syncs to localStorage)
  useAuthStore.getState().logout() // ✅ Single source of truth
}
```

---

## 🎯 Why This Fix Works

### Single Source of Truth

- ✅ All auth state managed by Zustand store
- ✅ No duplicate storage locations
- ✅ Consistent state across application
- ✅ Zustand persist middleware handles localStorage automatically

### Proper Synchronization

- ✅ Login updates Zustand → Zustand syncs to localStorage
- ✅ API client reads from Zustand → Always has latest tokens
- ✅ Token refresh updates Zustand → Zustand syncs to localStorage
- ✅ Logout clears Zustand → Zustand syncs to localStorage

### Using `getState()` Outside React Components

```typescript
// ✅ Correct: Use getState() in non-React code
const token = useAuthStore.getState().accessToken

// ❌ Wrong: Can't use hooks outside React components
const { accessToken } = useAuthStore() // Error!
```

---

## 📊 Impact Analysis

### Before Fix

**Login**:

- ✅ Zustand store updated
- ❌ API client can't read tokens
- ❌ All authenticated requests fail with 401
- ❌ User appears logged in but can't access protected resources

**Token Refresh**:

- ❌ Can't read refresh token
- ❌ Token refresh fails
- ❌ User logged out unexpectedly

**Logout**:

- ✅ Zustand store cleared
- ❌ Stale tokens might remain in localStorage
- ❌ Potential security issue

### After Fix

**Login**:

- ✅ Zustand store updated
- ✅ API client reads tokens from Zustand
- ✅ All authenticated requests include auth header
- ✅ User can access protected resources

**Token Refresh**:

- ✅ Reads refresh token from Zustand
- ✅ Updates new access token in Zustand
- ✅ Zustand syncs to localStorage
- ✅ Seamless token refresh

**Logout**:

- ✅ Zustand store cleared
- ✅ localStorage automatically synced
- ✅ No stale tokens
- ✅ Clean logout

---

## 🧪 Testing Scenarios

### Scenario 1: User Login

**Before Fix**:

```typescript
// User logs in
login(user, 'token123', 'refresh456')

// Try to fetch protected data
apiClient.get('/api/user/profile')
// ❌ No Authorization header
// ❌ Returns 401 Unauthorized
```

**After Fix**:

```typescript
// User logs in
login(user, 'token123', 'refresh456')

// Try to fetch protected data
apiClient.get('/api/user/profile')
// ✅ Authorization: Bearer token123
// ✅ Returns user profile
```

### Scenario 2: Token Refresh

**Before Fix**:

```typescript
// Token expires, 401 error
// Interceptor tries to refresh
const refreshToken = localStorage.getItem('refreshToken')
// ❌ Returns null
// ❌ Can't refresh token
// ❌ User logged out
```

**After Fix**:

```typescript
// Token expires, 401 error
// Interceptor tries to refresh
const refreshToken = useAuthStore.getState().refreshToken
// ✅ Returns 'refresh456'
// ✅ Refreshes token successfully
// ✅ Updates Zustand store
// ✅ User stays logged in
```

### Scenario 3: Logout

**Before Fix**:

```typescript
// User logs out
logout()
// ✅ Zustand store cleared
// ❌ localStorage['accessToken'] might still exist
// ❌ Potential security issue
```

**After Fix**:

```typescript
// User logs out
logout()
// ✅ Zustand store cleared
// ✅ localStorage automatically synced
// ✅ All tokens removed
// ✅ Clean logout
```

---

## 🔍 Code Review Checklist

- ✅ API client imports Zustand store
- ✅ Request interceptor reads from Zustand
- ✅ Response interceptor reads from Zustand
- ✅ Token refresh updates Zustand store
- ✅ Logout uses Zustand store
- ✅ No direct localStorage access for tokens
- ✅ Single source of truth maintained
- ✅ Proper use of `getState()` outside React

---

## 📝 Best Practices

### 1. Single Source of Truth

```typescript
// ✅ Good: Use Zustand store
const token = useAuthStore.getState().accessToken

// ❌ Bad: Direct localStorage access
const token = localStorage.getItem('accessToken')
```

### 2. Zustand Outside React Components

```typescript
// ✅ Good: Use getState() in non-React code
useAuthStore.getState().login(user, token, refresh)

// ❌ Bad: Can't use hooks outside React
const { login } = useAuthStore() // Error in non-React code!
```

### 3. Let Zustand Handle Persistence

```typescript
// ✅ Good: Update Zustand, let it sync
useAuthStore.getState().setTokens(accessToken, refreshToken)

// ❌ Bad: Manual localStorage management
localStorage.setItem('accessToken', accessToken)
```

---

## ✅ Summary

### Issue

Mismatch between where tokens are stored (Zustand) and where they're read from (localStorage), causing authentication to fail.

### Fix

Use Zustand store as single source of truth for all token operations.

### Changes

1. Import `useAuthStore` in API client and auth service
2. Read tokens from Zustand using `getState()`
3. Update tokens in Zustand after refresh
4. Logout via Zustand store (API client interceptor)
5. Logout via Zustand store (auth service)

### Result

- ✅ Authentication works correctly
- ✅ Token refresh works seamlessly
- ✅ Logout cleans up properly
- ✅ Single source of truth
- ✅ No storage mismatch

### Files Modified

1. `src/services/api/client.ts` (4 locations)
   - Import useAuthStore
   - Read access token from Zustand (request interceptor)
   - Read refresh token from Zustand (response interceptor)
   - Update tokens in Zustand after refresh
   - Logout via Zustand on auth failure

2. `src/services/api/auth/authService.ts` (1 location)
   - Import useAuthStore
   - Logout function now uses Zustand store instead of direct localStorage manipulation

### Status

✅ **CRITICAL ISSUE FIXED - ALL LOCATIONS**
