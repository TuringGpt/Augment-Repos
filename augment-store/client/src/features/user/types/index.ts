import type { Product } from '@features/products/types'

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  dateOfBirth?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  dateOfBirth?: string
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

