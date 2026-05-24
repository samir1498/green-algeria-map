import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TreeInfoModal } from './TreeInfoModal'
import type { ReactNode } from 'react'

const mockUseTreeInfo = vi.hoisted(() => vi.fn())

vi.mock('@/features/tree-info/hooks/useTreeInfo', () => ({
  useTreeInfo: mockUseTreeInfo,
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

describe('TreeInfoModal', () => {
  it('shows loading state', () => {
    mockUseTreeInfo.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(<TreeInfoModal taxonId={1} scientificName="Cedrus atlantica" onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByTestId('tree-info-loading')).toBeInTheDocument()
    expect(screen.getByTestId('tree-info-scientific-name')).toHaveTextContent('Cedrus atlantica')
  })

  it('shows error state', () => {
    mockUseTreeInfo.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(<TreeInfoModal taxonId={1} scientificName="Cedrus atlantica" onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByTestId('tree-info-error')).toBeInTheDocument()
  })

  it('displays species information when data is loaded', () => {
    mockUseTreeInfo.mockReturnValue({
      data: {
        summary: '',
        photos: ['https://example.com/photo.jpg'],
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Cedrus_atlantica',
        commonName: 'Atlas cedar',
        gbifCount: 42,
      },
      isLoading: false,
      isError: false,
    })

    render(<TreeInfoModal taxonId={1} scientificName="Cedrus atlantica" onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByTestId('tree-info-scientific-name')).toHaveTextContent('Cedrus atlantica')
    expect(screen.getByTestId('tree-info-common-name')).toHaveTextContent('Atlas cedar')
    expect(screen.getByTestId('tree-info-photo')).toBeInTheDocument()
    expect(screen.getByTestId('tree-info-gbif')).toHaveTextContent('42')
    expect(screen.getByTestId('tree-info-wikipedia')).toHaveAttribute(
      'href',
      'https://en.wikipedia.org/wiki/Cedrus_atlantica',
    )
    expect(screen.getByTestId('tree-info-content')).toBeInTheDocument()
  })

  it('hides GBIF section when count is null', () => {
    mockUseTreeInfo.mockReturnValue({
      data: {
        summary: '',
        photos: [],
        wikipediaUrl: null,
        commonName: null,
        gbifCount: null,
      },
      isLoading: false,
      isError: false,
    })

    render(<TreeInfoModal taxonId={1} scientificName="Test" onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    expect(screen.queryByTestId('tree-info-gbif')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tree-info-wikipedia')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    mockUseTreeInfo.mockReturnValue({
      data: {
        summary: '',
        photos: [],
        wikipediaUrl: null,
        commonName: null,
        gbifCount: null,
      },
      isLoading: false,
      isError: false,
    })

    render(<TreeInfoModal taxonId={1} scientificName="Test" onClose={onClose} />, {
      wrapper: createWrapper(),
    })

    await user.click(screen.getByTestId('tree-info-close'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
