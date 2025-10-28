import { apiClient } from '../client'
import { API_ENDPOINTS } from '@config/api'
import type {
  UserProfile,
  UserProfileAPI,
  UpdateProfileRequest,
  UpdateProfileRequestAPI,
  Address,
  CreateAddressRequest,
  WishlistItem,
} from '@features/user/types'

// Helper function to convert API response to frontend format
const convertProfileFromAPI = (apiProfile: UserProfileAPI): UserProfile => ({
  id: apiProfile.id,
  email: apiProfile.email,
  username: apiProfile.username,
  firstName: apiProfile.first_name,
  lastName: apiProfile.last_name,
  fullName: apiProfile.full_name,
  mobile: apiProfile.mobile,
  gender: apiProfile.gender,
  image: apiProfile.image,
  role: apiProfile.role,
  isActive: apiProfile.is_active,
  isRegistrationCompleted: apiProfile.is_registration_completed,
  dateJoined: apiProfile.date_joined,
})

// Helper function to convert frontend request to API format
const convertProfileToAPI = (data: UpdateProfileRequest): UpdateProfileRequestAPI => {
  const apiData: UpdateProfileRequestAPI = {}

  if (data.username !== undefined) apiData.username = data.username
  if (data.firstName !== undefined) apiData.first_name = data.firstName
  if (data.lastName !== undefined) apiData.last_name = data.lastName
  if (data.mobile !== undefined) apiData.mobile = data.mobile
  if (data.gender !== undefined) apiData.gender = data.gender
  if (data.image !== undefined) apiData.image = data.image

  return apiData
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfileAPI>(API_ENDPOINTS.USER.PROFILE)
    return convertProfileFromAPI(response)
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const apiData = convertProfileToAPI(data)
    const response = await apiClient.put<UserProfileAPI>(API_ENDPOINTS.USER.UPDATE_PROFILE, apiData)
    return convertProfileFromAPI(response)
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
