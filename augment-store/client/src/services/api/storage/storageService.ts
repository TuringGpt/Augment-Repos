import axios from 'axios'
import { apiClient } from '../client'
import { useAuthStore } from '@store/authStore'
import { API_ENDPOINTS } from '@config/api'
import type { FileUploadStartResponse, FileUploadFinishResponse } from '@features/storage/types'

/**
 * Storage Service
 * Handles direct file uploads to S3 via presigned POST:
 * 1. POST /storage/direct/ → Create file record and get presigned POST data
 * 2. POST <presigned_url> → Upload file directly to S3 (client-side)
 * 3. POST /storage/direct/finish/ → Mark upload complete and get final file URL
 */
class StorageService {
  /**
   * Step 1: Create file record and get presigned POST data
   * Returns file.id and presigned S3 POST data (url + fields)
   */
  private async startUpload(fileName: string, fileType: string): Promise<FileUploadStartResponse> {
    const response = await apiClient.post<FileUploadStartResponse>(
      API_ENDPOINTS.STORAGE.START_UPLOAD,
      {
        original_file_name: fileName,
        file_type: fileType,
      }
    )
    return response
  }

  /**
   * Step 3: Finish upload and get the final file response
   * Returns the full response with file object containing the final file URL
   */
  private async finishUpload(fileId: string): Promise<FileUploadFinishResponse> {
    const response = await apiClient.post<FileUploadFinishResponse>(
      API_ENDPOINTS.STORAGE.FINISH_UPLOAD,
      {
        file_id: fileId,
      }
    )
    return response
  }

  /**
   * Step 2: Upload file to S3 using presigned POST
   */
  private async uploadToS3(
    file: File,
    presignedUrl: string,
    presignedFields: Record<string, string>
  ): Promise<void> {
    const formData = new FormData()

    // Add all the presigned fields to formData
    Object.keys(presignedFields).forEach((key) => {
      formData.append(key, presignedFields[key])
    })

    // Add the file last (important for S3)
    formData.append('file', file)

    // Upload directly to S3 (not through our API)
    // Note: Don't set Content-Type header - let browser set it with proper boundary
    await axios.post(presignedUrl, formData)
  }

  /**
   * Complete upload process (3 steps)
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

      // Step 1: Create file record and get presigned POST data
      console.log('📤 Step 1: Creating file record at /storage/direct/')
      const startResponse = await this.startUpload(file.name, file.type)
      const fileId = startResponse.file.id
      const presignedUrl = startResponse.presigned_data.url
      const presignedFields = startResponse.presigned_data.fields
      console.log('✅ Step 1 complete - File ID:', fileId)

      // Step 2: Upload file directly to S3 using presigned POST
      console.log('📤 Step 2: Uploading file directly to S3...')
      await this.uploadToS3(file, presignedUrl, presignedFields)
      console.log('✅ Step 2 complete - File uploaded to S3')

      // Step 3: Finish upload and get final file URL
      console.log('📤 Step 3: Finishing upload at /storage/direct/finish/')
      const finishResponse = await this.finishUpload(fileId)
      console.log('✅ Step 3 complete - File ID:', finishResponse.file.id)

      if (!finishResponse.file?.id) {
        console.error('❌ File ID is empty or undefined')
        throw new Error('Invalid response from server: missing file ID')
      }

      console.log('✅ Upload complete! Returning file ID:', finishResponse.file.id)
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
