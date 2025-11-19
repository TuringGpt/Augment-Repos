export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
}

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    REFRESH_TOKEN: '/auth/refresh-token/',
    FORGOT_PASSWORD: '/auth/forgot-password/',
    RESET_PASSWORD: '/auth/reset-password/',
    VERIFY_EMAIL: '/auth/verify-email/',
  },

  // Product endpoints
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    BRANDS: '/products/brands',
    FEATURED: '/products/featured',
  },

  // Cart endpoints
  CART: {
    GET: '/carts',
    REMOVE: (itemId: string) => `/carts/items/${itemId}/`,
    UPDATE: (itemId: string) => `/carts/items/${itemId}/`,
    ADD: '/carts/add-item/',
    CLEAR: '/cart/clear',
  },

  // Checkout endpoints
  CHECKOUT: {
    INIT: '/checkout/init',
    PROCESS: '/checkout/process',
    VALIDATE: '/checkout/validate',
  },

  // Order endpoints
  ORDERS: {
    LIST: '/checkout/orders/',
    DETAIL: (id: string) => `/checkout/orders/${id}/`,
    CREATE: '/checkout/orders/create/',
    CANCEL: (id: string) => `/checkout/orders/${id}/cancel/`,
  },

  // User endpoints
  USER: {
    PROFILE: '/accounts/profile/',
    UPDATE_PROFILE: '/accounts/profile/',
    ADDRESSES: '/user/addresses',
    ADD_ADDRESS: '/user/addresses',
    UPDATE_ADDRESS: (id: string) => `/user/addresses/${id}`,
    DELETE_ADDRESS: (id: string) => `/user/addresses/${id}`,
  },

  // Wishlist endpoints
  WISHLIST: {
    GET: '/wishlist/',
    ADD: '/wishlist/add/',
    REMOVE: '/wishlist/remove/',
  },

  // Storage endpoints
  STORAGE: {
    START_UPLOAD: '/storage/direct/',
    FINISH_UPLOAD: '/storage/direct/finish/',
  },

  // Payment endpoints
  PAYMENT: {
    METHODS: '/payment/methods',
    PROCESS: '/payment/process',
    VERIFY: '/payment/verify',
  },
}
