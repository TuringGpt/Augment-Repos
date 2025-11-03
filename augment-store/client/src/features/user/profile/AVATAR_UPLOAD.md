# Avatar Upload Feature

## Overview

This feature allows users to upload and manage their profile avatar images using a 3-step direct upload process to local storage or S3.

## Architecture

### 3-Step Upload Process

#### For S3 Storage:

1. **Start Upload** - Create file record and get presigned POST data
   - `POST /storage/direct/`
   - Request: `{ original_file_name: string, file_type: string }`
   - Returns: `{ file: { id, ... }, presigned_data: { url, fields } }`
   - The `fields` object contains S3 presigned POST fields (key, policy, signature, etc.)

2. **Upload File** - Upload directly to S3 using presigned POST
   - `POST <presigned_data.url>` (direct to S3, not through backend)
   - Create FormData with all `presigned_data.fields` first, then append file last
   - Important: File must be appended last for S3 compatibility
   - Content-Type: `multipart/form-data`

3. **Finish Upload** - Mark upload as complete and get final file URL
   - `POST /storage/direct/finish/`
   - Request: `{ file_id: string }`
   - Returns: `{ file: { id, file: "https://...", ... }, file_id }`

4. **Update Profile** - Update user profile with file ID
   - `PATCH /accounts/profile/`
   - Request: `{ profile_image: file_id }` (ForeignKey to storage.File)
   - To remove: `{ profile_image: null }`

#### For Local Storage:

1. **Start Upload** - Create file record
   - `POST /storage/direct/`
   - Returns file ID

2. **Upload File** - Upload to backend
   - `POST /storage/direct/local/{file_id}/`
   - Uploads file using multipart/form-data

3. **Finish Upload** - Mark upload as complete
   - `POST /storage/direct/finish/`
   - Returns final file URL

## Components

### AvatarUpload Component

**Location:** `augment-store/client/src/features/user/profile/components/AvatarUpload.tsx`

**Features:**

- Avatar preview with user initials fallback
- Click to upload functionality
- File type validation (JPEG, PNG, GIF, WebP)
- File size validation (max 5MB)
- Loading state with spinner overlay
- Remove avatar button
- Error display
- Accessibility support (ARIA labels, keyboard navigation)

**Props:**

```typescript
interface AvatarUploadProps {
  currentImage: string | null // Current avatar URL
  userName: string // User name for initials
  onImageSelect: (file: File) => void // Callback when file selected
  onImageRemove: () => void // Callback when avatar removed
  isUploading: boolean // Upload in progress
  disabled?: boolean // Disable upload
  error?: string | null // Error message
}
```

### ProfilePage Integration

**Location:** `augment-store/client/src/features/user/profile/components/ProfilePage.tsx`

**State:**

- `isUploadingAvatar` - Upload in progress flag
- `avatarError` - Avatar upload error message
- `newAvatarUrl` - Newly uploaded avatar URL (before profile refresh)

**Handlers:**

- `handleAvatarSelect(file)` - Uploads avatar and updates profile
- `handleAvatarRemove()` - Removes avatar from profile

## Services

### StorageService

**Location:** `augment-store/client/src/services/api/storage/storageService.ts`

**Methods:**

```typescript
// Start direct file upload
startUpload(data: FileUploadStartRequest): Promise<FileUploadStartResponse>

// Finish direct file upload
finishUpload(data: FileUploadFinishRequest): Promise<FileUploadFinishResponse>

// Complete upload process (all 3 steps)
uploadFile(file: File): Promise<string>

// Upload avatar with validation
uploadAvatar(file: File): Promise<string>
```

**Validation:**

- File type: JPEG, JPG, PNG, GIF, WebP
- File size: Maximum 5MB

## Types

### Storage Types

**Location:** `augment-store/client/src/features/storage/types/index.ts`

```typescript
interface FileUploadStartRequest {
  original_file_name: string
  file_type: string
}

interface FileUploadStartResponse {
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
    url: string // S3 presigned POST URL
    fields: Record<string, string> // S3 presigned POST fields (key, policy, signature, etc.)
  }
}

interface FileUploadFinishResponse {
  file: {
    id: string
    file: string // Final file URL
    original_file_name: string
    file_name: string
    file_type: string
    created_by: string
    upload_finished_at: string
    created_at: string
    updated_at: string
  }
  file_id: string
}
```

## API Endpoints

### Storage Endpoints

```
POST   /storage/direct/                    - Start upload
POST   /storage/direct/local/{file_id}/    - Upload to local storage
POST   /storage/direct/finish/             - Finish upload
```

### Profile Endpoint

```
PATCH  /accounts/profile/                  - Update profile (including image)
```

## Backend Requirements

### Permissions

**Current:** Storage endpoints require `IsAuthenticated` + `hasAdminOrMerchantRole`

**Note:** For avatar upload to work for regular users, the backend permissions need to be updated to allow authenticated users to upload their own avatars.

**Recommended Solution:**

- Create a separate avatar upload endpoint with `IsAuthenticated` permission only
- OR modify storage permissions to allow authenticated users for avatar uploads
- OR use a custom permission class that allows users to upload their own avatars

### User Model

The User model already has an `image` field:

```python
image = models.ImageField(
    upload_to="user_images",
    null=True,
    blank=True,
)
```

### UpdateUserProfileSerializer

The serializer already includes the `image` field:

```python
class UpdateUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "mobile",
            "gender",
            "image",  # ✅ Already included
        ]
```

## Usage

### Upload Avatar

1. User clicks on avatar or camera icon
2. File picker opens
3. User selects image file
4. File is validated (type and size)
5. Preview is shown
6. File is uploaded to storage (3-step process)
7. Profile is updated with new avatar URL
8. Success message is displayed

### Remove Avatar

1. User clicks delete icon on avatar
2. Profile is updated with null profile_image field
3. Avatar is removed
4. Success message is displayed

## Error Handling

### Validation Errors

- Invalid file type → "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image."
- File too large → "File size too large. Maximum size is 5MB."

### Upload Errors

- Network error → "Failed to upload avatar"
- Server error → Error message from API response
- Permission error → "You don't have permission to upload files"

### Display

- Errors are shown in an Alert component below the avatar
- Errors auto-clear when user selects a new file

## Future Enhancements

1. **Image Cropping** - Allow users to crop/resize images before upload
2. **Drag & Drop** - Support drag and drop file upload
3. **Multiple Formats** - Support more image formats (SVG, AVIF)
4. **Compression** - Auto-compress large images before upload
5. **Progress Bar** - Show upload progress percentage
6. **Avatar Gallery** - Provide pre-made avatars to choose from
7. **Webcam Capture** - Allow users to take photo with webcam

## Testing

### Manual Testing

1. **Upload Valid Image**
   - Select JPEG/PNG/GIF/WebP image < 5MB
   - Verify preview shows
   - Verify upload succeeds
   - Verify profile updates

2. **Upload Invalid File Type**
   - Select PDF/TXT file
   - Verify error message shows

3. **Upload Large File**
   - Select image > 5MB
   - Verify error message shows

4. **Remove Avatar**
   - Click delete icon
   - Verify avatar is removed
   - Verify profile updates

5. **Loading States**
   - Verify spinner shows during upload
   - Verify buttons are disabled during upload

6. **Error Recovery**
   - Trigger upload error (disconnect network)
   - Verify error message shows
   - Reconnect and retry
   - Verify upload succeeds

## Known Issues

### Backend Permissions

The storage endpoints currently require `hasAdminOrMerchantRole` permission, which prevents regular users from uploading avatars. This needs to be addressed in the backend.

**Temporary Workaround:**

- Grant merchant role to users who need to upload avatars
- OR modify backend permissions (requires backend changes)

## Dependencies

- `lodash/delay` - For timeout management
- `@mui/material` - UI components
- `@mui/icons-material` - Icons (PhotoCamera, Delete)
- Existing: `axios`, `react`, `typescript`
