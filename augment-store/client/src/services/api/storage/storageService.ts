import { apiClient } from '../client'
import { useAuthStore } from '@store/authStore'
import type {
  FileUploadStartRequest,
  FileUploadStartResponse,
  FileUploadFinishRequest,
  FileUploadFinishResponse,
} from '@features/storage/types'

/**
 * Storage Service
 * Handles file uploads using the 3-step direct upload process:
 * 1. Start upload - get presigned URL
 * 2. Upload file to local storage or S3
 * 3. Finish upload - mark as complete
 */
class StorageService {
  /**
   * Step 1: Start direct file upload
   * Creates a file record and returns upload URL
   */
  async startUpload(data: FileUploadStartRequest): Promise<FileUploadStartResponse> {
    // Debug: Check if user is authenticated
    const { accessToken, isAuthenticated } = useAuthStore.getState()
    console.log('🔍 Storage Service Debug:', {
      isAuthenticated,
      hasAccessToken: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'null',
    })

    if (!isAuthenticated || !accessToken) {
      throw new Error('You must be logged in to upload files. Please login and try again.')
    }

    // apiClient.post already returns response.data, so we don't need .data again
    const response = await apiClient.post<FileUploadStartResponse>('/storage/direct/', data)
    return response
  }

  /**
   * Step 2: Upload file to local storage
   * For local storage, uploads the actual file
   */
  async uploadLocal(file: File, fileId: string): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_id', fileId)

    await apiClient.post(`/storage/direct/local/${fileId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * Step 3: Finish direct file upload
   * Marks the upload as complete
   */
  async finishUpload(data: FileUploadFinishRequest): Promise<FileUploadFinishResponse> {
    // apiClient.post already returns response.data, so we don't need .data again
    const response = await apiClient.post<FileUploadFinishResponse>('/storage/direct/finish/', data)
    return response
  }

  /**
   * Complete upload process (all 3 steps)
   * Returns the final file URL
   */
  async uploadFile(file: File): Promise<string> {
    try {
      // Step 1: Start upload
      console.log('📤 Step 1: Starting upload for file:', file.name)
      const startResponse = await this.startUpload({
        original_file_name: file.name,
        file_type: file.type,
      })
      console.log('✅ Step 1 response:', startResponse)

      const fileId = startResponse.file.id
      console.log('📝 File ID:', fileId)

      // Step 2: Upload to local storage
      console.log('📤 Step 2: Uploading to local storage...')
      await this.uploadLocal(file, fileId)
      console.log('✅ Step 2 complete')

      // Step 3: Finish upload
      console.log('📤 Step 3: Finishing upload...')
      const finishResponse = await this.finishUpload({ file_id: fileId })
      console.log('✅ Step 3 response:', finishResponse)

      // Check if response has the expected structure
      if (!finishResponse.file) {
        console.error('❌ finishResponse.file is undefined:', finishResponse)
        throw new Error('Invalid response from server: missing file data')
      }

      if (!finishResponse.file.file) {
        console.error('❌ finishResponse.file.file is undefined:', finishResponse.file)
        throw new Error('Invalid response from server: missing file URL')
      }

      const fileUrl = finishResponse.file.file
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
