import { apiClient } from '../client'
import { useAuthStore } from '@store/authStore'
import { API_ENDPOINTS } from '@config/api'
import axios from 'axios'

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
    fields: {
      acl: string
      'Content-Type': string
      key: string
      'x-amz-algorithm': string
      'x-amz-credential': string
      'x-amz-date': string
      policy: string
      'x-amz-signature': string
    }
  }
}

/**
 * Storage Service
 * Handles file uploads using S3 presigned POST:
 * 1. POST /storage/direct/ → Get presigned data and file_id
 * 2. POST to S3 with presigned fields → Upload file
 * 3. POST /storage/direct/{file_id}/ → Confirm upload and get final URL
 */
class StorageService {
  /**
   * Step 1: Start upload and get presigned data
   * Returns file_id and presigned POST data for S3 upload
   */
  private async startUpload(fileName: string, fileType: string): Promise<StartUploadResponse> {
    const response = await apiClient.post<StartUploadResponse>(API_ENDPOINTS.STORAGE.START_UPLOAD, {
      original_file_name: fileName,
      file_type: fileType,
    })
    return response
  }

  /**
   * Step 2: Upload file to S3 using presigned POST
   * Uses FormData with presigned fields
   */
  private async uploadToS3(
    file: File,
    presignedUrl: string,
    presignedFields: Record<string, string>
  ): Promise<void> {
    // Create FormData with presigned fields
    const formData = new FormData()

    // Add all presigned fields first (order matters for S3)
    Object.entries(presignedFields).forEach(([key, value]) => {
      formData.append(key, value)
    })

    // Add the file last
    formData.append('file', file)

    // Upload to S3 using POST (not PUT)
    await axios.post(presignedUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * Step 3: Confirm upload and get the final file URL
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

      // Step 1: Get presigned data from backend
      console.log('📤 Step 1: Getting presigned data from /storage/direct/')
      const startResponse = await this.startUpload(file.name, file.type)
      const fileId = startResponse.file.id
      const presignedUrl = startResponse.presigned_data.url
      const presignedFields = startResponse.presigned_data.fields
      console.log('✅ Step 1 complete - File ID:', fileId)
      console.log('📝 Presigned URL:', presignedUrl)
      console.log('📝 Presigned fields:', presignedFields)

      // Step 2: Upload to S3 using presigned POST
      console.log('📤 Step 2: Uploading to S3 with presigned POST...')
      await this.uploadToS3(file, presignedUrl, presignedFields)
      console.log('✅ Step 2 complete')

      // Step 3: Confirm upload and get final file URL
      console.log('📤 Step 3: Confirming upload at /storage/direct/finish/')
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
