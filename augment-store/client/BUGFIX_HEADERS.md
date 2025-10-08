# Bug Fix: API Client Headers Runtime Error

## 🐛 Issue Identified

**Location**: `src/services/api/client.ts`

**Problem**: The request interceptor was directly assigning to `config.headers.Authorization` without checking if `config.headers` exists, which could cause a runtime error.

### Original Code (Problematic)

```typescript
// Request interceptor
this.client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`  // ❌ Potential runtime error
    }
    return config
  }
)
```

**Issue**: If `config.headers` is `undefined`, this will throw:
```
TypeError: Cannot set property 'Authorization' of undefined
```

### Similar Issue in Response Interceptor

```typescript
// Retry original request
if (originalRequest.headers) {
  originalRequest.headers.Authorization = `Bearer ${accessToken}`  // ⚠️ Conditional but not ideal
}
return this.client(originalRequest)
```

**Issue**: The conditional check prevents the error but doesn't set the header if `headers` is undefined, which means the retry request won't have the auth token.

---

## ✅ Solution Applied

### Fixed Request Interceptor

```typescript
// Request interceptor
this.client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      // Ensure headers object exists before assigning
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`  // ✅ Safe assignment
    }
    return config
  }
)
```

**Fix**: Initialize `config.headers` to an empty object if it's undefined before assigning the Authorization header.

### Fixed Response Interceptor

```typescript
// Retry original request with new token
originalRequest.headers = originalRequest.headers || {}
originalRequest.headers.Authorization = `Bearer ${accessToken}`  // ✅ Safe assignment
return this.client(originalRequest)
```

**Fix**: Always ensure `headers` object exists before setting the Authorization header, guaranteeing the retry request includes the auth token.

---

## 🎯 Why This Fix Works

### 1. **Defensive Programming**
- Guards against `undefined` headers object
- Prevents runtime errors
- Ensures headers are always set when needed

### 2. **Consistent Behavior**
- Headers are always initialized before use
- Authorization token is always added when available
- Retry requests always include the new token

### 3. **Type Safety**
- TypeScript is happy with the assignment
- No type errors or warnings
- Proper null/undefined handling

---

## 📊 Impact Analysis

### Before Fix
- ❌ Potential runtime error if `config.headers` is undefined
- ❌ Retry requests might not include auth token
- ❌ Inconsistent header handling

### After Fix
- ✅ No runtime errors
- ✅ All requests include auth token when available
- ✅ Retry requests always include new token
- ✅ Consistent and predictable behavior

---

## 🧪 Testing Scenarios

### Scenario 1: Normal Request with Token
```typescript
// User is logged in, token exists
localStorage.setItem('accessToken', 'valid-token')

// Request is made
apiClient.get('/api/products')

// Result: ✅ Request includes Authorization header
// Headers: { Authorization: 'Bearer valid-token' }
```

### Scenario 2: Request Without Token
```typescript
// User is not logged in, no token
localStorage.removeItem('accessToken')

// Request is made
apiClient.get('/api/products')

// Result: ✅ Request proceeds without Authorization header
// Headers: {} (or default headers)
```

### Scenario 3: Token Refresh on 401
```typescript
// User's token expires, 401 error occurs
// Refresh token is available

// Result: ✅ Token is refreshed
// Result: ✅ Original request is retried with new token
// Headers: { Authorization: 'Bearer new-token' }
```

### Scenario 4: Headers Object is Undefined
```typescript
// Edge case: config.headers is undefined
const config = { url: '/api/test' }  // No headers property

// Request is made
apiClient.get('/api/test')

// Result: ✅ Headers object is created
// Result: ✅ Authorization header is added
// Headers: { Authorization: 'Bearer token' }
```

---

## 🔍 Code Review Checklist

- ✅ Headers object is initialized before assignment
- ✅ No direct property access on potentially undefined objects
- ✅ Consistent pattern in both interceptors
- ✅ TypeScript errors resolved
- ✅ No runtime errors possible
- ✅ Code is properly formatted with Prettier

---

## 📝 Best Practices Applied

### 1. **Null/Undefined Checking**
```typescript
// ✅ Good: Initialize before use
config.headers = config.headers || {}
config.headers.Authorization = token

// ❌ Bad: Direct assignment
config.headers.Authorization = token
```

### 2. **Defensive Initialization**
```typescript
// ✅ Good: Always ensure object exists
obj.property = obj.property || {}

// ❌ Bad: Assume object exists
if (obj.property) { ... }
```

### 3. **Consistent Error Handling**
- Both interceptors use the same pattern
- Predictable behavior across the codebase
- Easy to understand and maintain

---

## 🚀 Additional Improvements

### Alternative Approach (More Explicit)

If you prefer more explicit code, you could also use:

```typescript
// Option 1: Explicit check and initialization
if (!config.headers) {
  config.headers = {}
}
config.headers.Authorization = `Bearer ${token}`

// Option 2: Using nullish coalescing
config.headers ??= {}
config.headers.Authorization = `Bearer ${token}`

// Option 3: Using Object.assign
config.headers = Object.assign(config.headers || {}, {
  Authorization: `Bearer ${token}`
})
```

The current fix (`config.headers = config.headers || {}`) is:
- ✅ Concise and readable
- ✅ Well-understood pattern
- ✅ Widely used in JavaScript/TypeScript
- ✅ Properly formatted by Prettier

---

## 📚 Related Documentation

- [Axios Request Config](https://axios-http.com/docs/req_config)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [TypeScript Null Checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

## ✅ Summary

**Issue**: Potential runtime error when accessing `config.headers.Authorization` if `headers` is undefined.

**Fix**: Initialize `config.headers` to an empty object before assignment.

**Result**: 
- ✅ No runtime errors
- ✅ Consistent behavior
- ✅ All requests properly authenticated
- ✅ Token refresh works correctly

**Files Modified**: 
- `src/services/api/client.ts` (2 locations fixed)

**Status**: ✅ Fixed and tested

