import { useState, useRef } from 'react'
import { Box, Avatar, IconButton, CircularProgress, Typography, Alert } from '@mui/material'
import { PhotoCamera, Delete } from '@mui/icons-material'
import { Colors } from '@config/colors'

interface AvatarUploadProps {
  currentImage: string | null
  userName: string
  onImageSelect: (file: File) => void
  onImageRemove: () => void
  isUploading: boolean
  disabled?: boolean
  error?: string | null
}

/**
 * AvatarUpload Component
 * Handles avatar image selection with preview
 */
export const AvatarUpload = ({
  currentImage,
  userName,
  onImageSelect,
  onImageRemove,
  isUploading,
  disabled = false,
  error = null,
}: AvatarUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Notify parent component
    onImageSelect(file)
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageRemove()
  }

  const handleAvatarClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  const displayImage = previewUrl || currentImage
  const showInitials = !displayImage

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box sx={{ position: 'relative' }}>
        <Avatar
          src={displayImage || undefined}
          sx={{
            width: 120,
            height: 120,
            fontSize: '3rem',
            bgcolor: Colors.primary.main,
            cursor: disabled || isUploading ? 'default' : 'pointer',
            border: `4px solid ${Colors.background.paper}`,
            boxShadow: 3,
          }}
          onClick={handleAvatarClick}
        >
          {showInitials && userName.charAt(0).toUpperCase()}
        </Avatar>

        {isUploading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
            }}
          >
            <CircularProgress size={40} sx={{ color: 'white' }} />
          </Box>
        )}

        {!disabled && !isUploading && (
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              bgcolor: Colors.primary.main,
              color: 'white',
              '&:hover': {
                bgcolor: Colors.primary.dark,
              },
              boxShadow: 2,
            }}
            size="small"
            onClick={handleAvatarClick}
            aria-label="Upload avatar"
          >
            <PhotoCamera fontSize="small" />
          </IconButton>
        )}

        {!disabled && !isUploading && displayImage && (
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              bgcolor: Colors.error.main,
              color: 'white',
              '&:hover': {
                bgcolor: Colors.error.dark,
              },
              boxShadow: 2,
            }}
            size="small"
            onClick={handleRemoveImage}
            aria-label="Remove avatar"
          >
            <Delete fontSize="small" />
          </IconButton>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
        aria-label="Avatar file input"
      />

      {!disabled && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          Click to upload avatar
          <br />
          (JPEG, PNG, GIF, WebP - Max 5MB)
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
      )}
    </Box>
  )
}

