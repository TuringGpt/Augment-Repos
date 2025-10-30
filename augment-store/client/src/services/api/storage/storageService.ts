import { apiClient } from '../client'
import { useAuthStore } from '@store/authStore'
import { API_ENDPOINTS } from '@config/api'

interface StartUploadResponse {
  file: {
    id: string
    file: string
    original_file_name: string
    file_name: string
    file_type: string
    upload_finished_at: string | null
    created_by: string
    created_at: string
    updated_at: string
  }
  presigned_data: {
    url: string
    fields: Record<string, string>
  }
}

/**
 * Storage Service
 * Handles file uploads through backend (backend uploads to S3):
 * 1. POST /storage/direct/ → Create file record, get file.id
 * 2. POST /storage/direct/finish/ → Confirm upload and get final file URL
 */
class StorageService {
  /**
   * Step 1: Create file record
   * Returns file.id for the upload
   */
  private async startUpload(fileName: string, fileType: string): Promise<StartUploadResponse> {
    const response = await apiClient.post<StartUploadResponse>(API_ENDPOINTS.STORAGE.START_UPLOAD, {
      original_file_name: fileName,
      file_type: fileType,
    })
    return response
  }

  /**
   * Step 2: Finish upload and get the final file response
   * Returns the full response with file object and presigned_data
   */
  private async finishUpload(fileId: string): Promise<StartUploadResponse> {
    const response = await apiClient.post<StartUploadResponse>(
      API_ENDPOINTS.STORAGE.FINISH_UPLOAD,
      {
        file_id: fileId,
      }
    )
    console.log('📥 Response from /storage/direct/finish/:', response)
    return response
  }

  /**
   * Complete upload process (2 steps)
   * Returns the file ID (to be used as ForeignKey reference)
   */
  async uploadFile(file: File): Promise<string> {
    // Check authentication
    const { accessToken, isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated || !accessToken) {
      throw new Error('You must be logged in to upload files. Please login and try again.')
    }

    try {
      console.log('📤 Starting upload for file:', file.name)

      // Step 1: Create file record and get file.id
      console.log('📤 Step 1: Creating file record at /storage/direct/')
      const startResponse = await this.startUpload(file.name, file.type)
      const fileId = startResponse.file.id
      console.log('✅ Step 1 complete - File ID:', fileId)

      // Step 2: Finish upload and get final response
      console.log('📤 Step 2: Finishing upload at /storage/direct/finish/')
      const finishResponse = await this.finishUpload(fileId)
      console.log('✅ Step 2 complete - Received response from /storage/direct/finish/')
      console.log('📝 File object:', finishResponse.file)

      if (!finishResponse.file?.id) {
        console.error('❌ File ID is empty or undefined')
        throw new Error('Invalid response from server: missing file ID')
      }

      console.log('✅ Upload complete! Returning file ID:', finishResponse.file.id)
      console.log('📌 This ID will be saved to profile.profile_image (ForeignKey)')
      return finishResponse.file.id
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
