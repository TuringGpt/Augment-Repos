import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  UserProfile,
  UpdateProfileRequest,
  Address,
  CreateAddressRequest,
  WishlistItem,
} from '@features/user/types'

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(API_ENDPOINTS.USER.PROFILE)
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    return apiClient.patch<UserProfile>(API_ENDPOINTS.USER.UPDATE_PROFILE, data)
  },

  getAddresses: async (): Promise<Address[]> => {
    return apiClient.get<Address[]>(API_ENDPOINTS.USER.ADDRESSES)
  },

  addAddress: async (data: CreateAddressRequest): Promise<Address> => {
    return apiClient.post<Address>(API_ENDPOINTS.USER.ADD_ADDRESS, data)
  },

  updateAddress: async (id: string, data: CreateAddressRequest): Promise<Address> => {
    return apiClient.patch<Address>(API_ENDPOINTS.USER.UPDATE_ADDRESS(id), data)
  },

  deleteAddress: async (id: string): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.USER.DELETE_ADDRESS(id))
  },

  getWishlist: async (): Promise<WishlistItem[]> => {
    return apiClient.get<WishlistItem[]>(API_ENDPOINTS.USER.WISHLIST)
  },

  addToWishlist: async (productId: string): Promise<WishlistItem> => {
    return apiClient.post<WishlistItem>(API_ENDPOINTS.USER.ADD_TO_WISHLIST, { productId })
  },

  removeFromWishlist: async (id: string): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.USER.REMOVE_FROM_WISHLIST(id))
  },
}
