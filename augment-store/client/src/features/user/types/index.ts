import type { Product } from '@features/products/types'

// User profile (matches backend API format with snake_case)
export interface UserProfile {
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

// Update profile request (matches backend API format with snake_case)
export interface UpdateProfileRequest {
  username?: string
  first_name?: string
  last_name?: string
  mobile?: string
  gender?: 'Male' | 'Female' | 'Other'
  image?: string // Legacy ImageField (direct file URL)
  profile_image?: string // ForeignKey to storage.File (file ID)
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
