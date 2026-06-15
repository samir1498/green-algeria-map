import { useState } from 'react'
import { api } from '@/shared/lib/axios'
import { toast } from 'sonner'

interface ZonePhotoUploaderProps {
  zoneId: string
  onPhotoUploaded?: (photoUrl: string) => void
}

export const ZonePhotoUploader: React.FC<ZonePhotoUploaderProps> = ({
  zoneId,
  onPhotoUploaded,
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please select an image smaller than 5MB')
      return
    }

    // Create preview
    setPreviewUrl(URL.createObjectURL(file))

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(`/api/storage/zones/${zoneId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const { photoUrl } = response.data
      toast.success('Photo successfully uploaded to zone')

      if (onPhotoUploaded) {
        onPhotoUploaded(photoUrl)
      }

      // Reset form
      e.target.value = ''
      setPreviewUrl(null)
    } catch (error: any) {
      console.error('Upload failed:', error)
      toast.error(error.response?.data?.message || 'Failed to upload photo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400"
        data-testid="upload-dropzone"
      >
        <input
          type="file"
          accept="image/*"
          id="zone-photo-input"
          key="zone-photo-input"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          onChange={handleFileChange}
          data-testid="file-input"
        />
        <label htmlFor="zone-photo-input" data-testid="photo-upload-label" className="w-full flex cursor-pointer flex-col items-center gap-3 text-gray-600 hover:text-gray-800">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-xs rounded"
              data-testid="preview-image"
            />
          ) : (
            <>
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16v4a2 2 0 002 2h8a2 2 0 002-2v-4M11 8h6m-6 0v6m6-0V8m0 0l3-3m-3 3l-3-3"
                />
              </svg>
              <div>
                <p className="font-medium">Click to upload photo</p>
                <p className="text-sm text-gray-500">JPG, PNG, GIF (max 5MB)</p>
              </div>
            </>
          )}
        </label>
      </div>

      {isUploading && (
        <div className="flex justify-center" data-testid="uploading-spinner">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      )}
    </div>
  )
}
