import { apiClient } from '../client'
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
    const response = await apiClient.post<FileUploadStartResponse>('/storage/direct/', data)
    return response.data
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
    const response = await apiClient.post<FileUploadFinishResponse>(
      '/storage/direct/finish/',
      data
    )
    return response.data
  }

  /**
   * Complete upload process (all 3 steps)
   * Returns the final file URL
   */
  async uploadFile(file: File): Promise<string> {
    // Step 1: Start upload
    const startResponse = await this.startUpload({
      original_file_name: file.name,
      file_type: file.type,
    })

    const fileId = startResponse.file.id

    // Step 2: Upload to local storage
    await this.uploadLocal(file, fileId)

    // Step 3: Finish upload
    const finishResponse = await this.finishUpload({ file_id: fileId })

    return finishResponse.file.file
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

