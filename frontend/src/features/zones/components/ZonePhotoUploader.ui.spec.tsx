// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, render, waitFor, cleanup, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ZonePhotoUploader } from './ZonePhotoUploader'

const mockPost = vi.hoisted(() => vi.fn())

vi.mock('@/shared/lib/axios', () => ({
  api: {
    post: mockPost,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('ZonePhotoUploader', () => {
  const zoneId = '550e8400-e29b-41d4-a716-446655440000'

  function createFile(name: string, type: string, size = 100): File {
    return new File([new ArrayBuffer(size)], name, { type })
  }

  it('renders upload dropzone', () => {
    render(<ZonePhotoUploader zoneId={zoneId} />, { wrapper: createWrapper() })

    expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument()
    expect(screen.getByTestId('file-input')).toBeInTheDocument()
  })

  it('shows preview and spinner while uploading, then clears on success', async () => {
    const file = createFile('photo.jpg', 'image/jpeg')
    let resolveUpload: (value: unknown) => void
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve
    })
    mockPost.mockReturnValueOnce(uploadPromise)

    render(<ZonePhotoUploader zoneId={zoneId} />, { wrapper: createWrapper() })

    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('preview-image')).toBeInTheDocument()
    })

    expect(screen.getByTestId('uploading-spinner')).toBeInTheDocument()

    resolveUpload!({ data: { photoUrl: 'http://example.com/photo.jpg' } })

    await waitFor(() => {
      expect(screen.queryByTestId('preview-image')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.queryByTestId('uploading-spinner')).not.toBeInTheDocument()
    })
  })

  it('calls api.post with correct URL and FormData on file select', async () => {
    mockPost.mockResolvedValueOnce({ data: { photoUrl: 'http://example.com/photo.jpg' } })
    render(<ZonePhotoUploader zoneId={zoneId} />, { wrapper: createWrapper() })

    const file = createFile('photo.jpg', 'image/jpeg')
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledOnce()
    })

    expect(mockPost).toHaveBeenCalledWith(`/api/storage/zones/${zoneId}/photo`, expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const formDataArg = mockPost.mock.calls[0][1] as FormData
    expect(formDataArg.get('file')).toBeInstanceOf(File)
    expect((formDataArg.get('file') as File).name).toBe('photo.jpg')
  })

  it('rejects non-image files without calling api', () => {
    render(<ZonePhotoUploader zoneId={zoneId} />, { wrapper: createWrapper() })

    const file = createFile('note.txt', 'text/plain')
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })

    expect(mockPost).not.toHaveBeenCalled()
  })

  it('rejects files larger than 5MB without calling api', () => {
    render(<ZonePhotoUploader zoneId={zoneId} />, { wrapper: createWrapper() })

    const largeFile = createFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024)
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [largeFile] } })

    expect(mockPost).not.toHaveBeenCalled()
  })

  it('calls onPhotoUploaded callback after successful upload', async () => {
    const onPhotoUploaded = vi.fn()
    mockPost.mockResolvedValueOnce({ data: { photoUrl: 'http://example.com/photo.jpg' } })
    render(<ZonePhotoUploader zoneId={zoneId} onPhotoUploaded={onPhotoUploaded} />, {
      wrapper: createWrapper(),
    })

    const file = createFile('photo.jpg', 'image/jpeg')
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } })

    await waitFor(() => {
      expect(onPhotoUploaded).toHaveBeenCalledWith('http://example.com/photo.jpg')
    })
  })
})
