// Storage API types

export interface FileUploadStartRequest {
  original_file_name: string
  file_type: string
}

export interface FileUploadStartResponse {
  file: {
    id: string
    original_file_name: string
    file_name: string
    file_type: string
    file: string | null
    created_by: string
    upload_finished_at: string | null
    created_at: string
    updated_at: string
  }
  presigned_data: {
    url: string
    presigned_data?: Record<string, unknown>
  }
}

export interface FileUploadLocalRequest {
  file: File
  file_id: string
}

export interface FileUploadFinishRequest {
  file_id: string
}

export interface FileUploadFinishResponse {
  file: {
    id: string
    original_file_name: string
    file_name: string
    file_type: string
    file: string
    created_by: string
    upload_finished_at: string
    created_at: string
    updated_at: string
  }
  file_id: string
}

