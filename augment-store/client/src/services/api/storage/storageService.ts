import { apiClient } from '../client'
import { useAuthStore } from '@store/authStore'
import { API_ENDPOINTS } from '@config/api'

/**
 * Storage Service
 * Handles file uploads using a 2-step process:
 * 1. Upload file to /storage/direct/local/{file_id}/ (file_id is generated as random UUID)
 * 2. Finish upload by calling /storage/direct/finish/ which returns the file URL as string
 */
class StorageService {
  /**
   * Generate a random UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Step 1: Upload file to local storage
   * Uploads the actual file with a generated UUID
   */
  private async uploadToLocal(file: File, fileId: string): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_id', fileId)

    await apiClient.post(API_ENDPOINTS.STORAGE.LOCAL_UPLOAD(fileId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * Step 2: Finish upload and get the file URL
   * Returns the file URL as a string
   */
  private async finishUpload(fileId: string): Promise<string> {
    const response = await apiClient.post<{ file: string }>(API_ENDPOINTS.STORAGE.FINISH_UPLOAD, {
      file_id: fileId,
    })
    return response.file
  }

  /**
   * Complete upload process (2 steps)
   * Returns the final file URL as a string
   */
  async uploadFile(file: File): Promise<string> {
    // Check authentication
    const { accessToken, isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated || !accessToken) {
      throw new Error('You must be logged in to upload files. Please login and try again.')
    }

    try {
      // Generate a random UUID for the file
      const fileId = this.generateUUID()
      console.log('📤 Starting upload for file:', file.name)
      console.log('📝 Generated file ID:', fileId)

      // Step 1: Upload file to local storage
      console.log('📤 Step 1: Uploading to /storage/direct/local/{file_id}/')
      await this.uploadToLocal(file, fileId)
      console.log('✅ Step 1 complete')

      // Step 2: Finish upload and get file URL
      console.log('📤 Step 2: Calling /storage/direct/finish/ to get file URL')
      const fileUrl = await this.finishUpload(fileId)
      console.log('✅ Step 2 complete')

      if (!fileUrl) {
        console.error('❌ File URL is empty or undefined')
        throw new Error('Invalid response from server: missing file URL')
      }

      console.log('✅ Upload complete! File URL:', fileUrl)
      return fileUrl
    } catch (error) {
      console.error('❌ Upload failed:', error)
      throw error
    }
  }

  /**
   * Upload avatar image
   * Validates file type and size before uploading
   */
  async uploadAvatar(file: File): Promise<string> {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.')
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.')
    }

    return this.uploadFile(file)
  }
}

export const storageService = new StorageService()
