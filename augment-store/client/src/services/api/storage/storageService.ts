import { apiClient } from '../client'
import { useAuthStore } from '@store/authStore'
import { API_ENDPOINTS } from '@config/api'
import axios from 'axios'

interface StartUploadResponse {
  file: {
    id: string
    original_file_name: string
    file_name: string
    file_type: string
  }
  presigned_data: {
    url: string
    presigned_data?: Record<string, unknown>
  }
}

/**
 * Storage Service
 * Handles file uploads using S3 presigned URLs:
 * 1. POST /storage/direct/ → Get presigned URL and file_id
 * 2. Upload file to S3 using presigned URL
 * 3. POST /storage/direct/finish/ → Get the actual file URL as string
 */
class StorageService {
  /**
   * Step 1: Start upload and get presigned URL
   * Returns file_id and presigned URL for S3 upload
   */
  private async startUpload(fileName: string, fileType: string): Promise<StartUploadResponse> {
    const response = await apiClient.post<StartUploadResponse>(API_ENDPOINTS.STORAGE.START_UPLOAD, {
      original_file_name: fileName,
      file_type: fileType,
    })
    return response
  }

  /**
   * Step 2: Upload file to S3 using presigned URL
   * Uses axios directly (not apiClient) to avoid auth headers
   */
  private async uploadToS3(file: File, presignedUrl: string): Promise<void> {
    // Upload directly to S3 using presigned URL
    // Don't use apiClient here as S3 doesn't need auth headers
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    })
  }

  /**
   * Step 3: Finish upload and get the file URL
   * Returns the file URL as a string
   */
  private async finishUpload(fileId: string): Promise<string> {
    const response = await apiClient.post<{ file: string }>(API_ENDPOINTS.STORAGE.FINISH_UPLOAD, {
      file_id: fileId,
    })
    return response.file
  }

  /**
   * Complete upload process (3 steps)
   * Returns the final file URL as a string
   */
  async uploadFile(file: File): Promise<string> {
    // Check authentication
    const { accessToken, isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated || !accessToken) {
      throw new Error('You must be logged in to upload files. Please login and try again.')
    }

    try {
      console.log('📤 Starting upload for file:', file.name)

      // Step 1: Get presigned URL from backend
      console.log('📤 Step 1: Getting presigned URL from /storage/direct/')
      const startResponse = await this.startUpload(file.name, file.type)
      const fileId = startResponse.file.id
      const presignedUrl = startResponse.presigned_data.url
      console.log('✅ Step 1 complete - File ID:', fileId)
      console.log('📝 Presigned URL:', presignedUrl)

      // Step 2: Upload to S3 using presigned URL
      console.log('📤 Step 2: Uploading to S3...')
      await this.uploadToS3(file, presignedUrl)
      console.log('✅ Step 2 complete')

      // Step 3: Finish upload and get file URL
      console.log('📤 Step 3: Calling /storage/direct/finish/ to get file URL')
      const fileUrl = await this.finishUpload(fileId)
      console.log('✅ Step 3 complete')

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
