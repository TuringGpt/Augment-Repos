import type { Product } from '@features/products/types'

// Backend API response format (snake_case)
export interface UserProfileAPI {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  full_name: string
  mobile: string
  gender: 'Male' | 'Female' | 'Other'
  image: string
  role: 'admin' | 'customer'
  is_active: boolean
  is_registration_completed: boolean
  date_joined: string
}

// Frontend format (camelCase)
export interface UserProfile {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  fullName: string
  mobile: string
  gender: 'Male' | 'Female' | 'Other'
  image: string
  role: 'admin' | 'customer'
  isActive: boolean
  isRegistrationCompleted: boolean
  dateJoined: string
}

// Backend API request format for update (snake_case)
export interface UpdateProfileRequestAPI {
  username?: string
  first_name?: string
  last_name?: string
  mobile?: string
  gender?: 'Male' | 'Female' | 'Other'
  image?: string
}

// Frontend format for update (camelCase)
export interface UpdateProfileRequest {
  username?: string
  firstName?: string
  lastName?: string
  mobile?: string
  gender?: 'Male' | 'Female' | 'Other'
  image?: string
}

export interface Address {
  id: string
  type: 'shipping' | 'billing'
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

export interface CreateAddressRequest {
  type: 'shipping' | 'billing'
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault?: boolean
}

export interface WishlistItem {
  id: string
  product: Product
  addedAt: string
}
