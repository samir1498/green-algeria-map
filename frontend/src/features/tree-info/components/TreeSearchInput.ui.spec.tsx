import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TreeSearchInput } from './TreeSearchInput'
import type { ReactNode } from 'react'

const mockUseTreeSearch = vi.hoisted(() => vi.fn())

vi.mock('@/features/tree-info/hooks/useTreeSearch', () => ({
  useTreeSearch: mockUseTreeSearch,
  DEBOUNCE_MS: 0,
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

describe('TreeSearchInput', () => {
  it('renders input with placeholder', () => {
    mockUseTreeSearch.mockReturnValue({ data: [], isFetching: false })

    render(<TreeSearchInput onSelect={vi.fn()} />, { wrapper: createWrapper() })

    expect(screen.getByTestId('tree-search-input')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search tree species...')).toBeInTheDocument()
  })

  it('shows custom placeholder when provided', () => {
    mockUseTreeSearch.mockReturnValue({ data: [], isFetching: false })

    render(<TreeSearchInput onSelect={vi.fn()} placeholder="Find a tree..." />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByPlaceholderText('Find a tree...')).toBeInTheDocument()
  })

  it('does not show dropdown when query is too short', async () => {
    mockUseTreeSearch.mockReturnValue({ data: [], isFetching: false, isLoading: false })

    const user = userEvent.setup()
    render(<TreeSearchInput onSelect={vi.fn()} />, { wrapper: createWrapper() })

    await user.type(screen.getByTestId('tree-search-input'), 'a')

    expect(screen.queryByTestId('tree-search-dropdown')).not.toBeInTheDocument()
  })

  it('shows dropdown with results after typing', async () => {
    mockUseTreeSearch.mockReturnValue({
      data: [
        { id: 1, name: 'Cedrus atlantica', commonName: 'Atlas cedar', rank: 'species' },
        { id: 2, name: 'Pinus halepensis', commonName: null, rank: 'species' },
      ],
      isFetching: false,
    })

    const user = userEvent.setup()
    render(<TreeSearchInput onSelect={vi.fn()} />, { wrapper: createWrapper() })

    await user.type(screen.getByTestId('tree-search-input'), 'ce')

    await waitFor(() => {
      expect(screen.getByTestId('tree-search-dropdown')).toBeInTheDocument()
    })

    expect(screen.getByText('Cedrus atlantica')).toBeInTheDocument()
    expect(screen.getByText('(Atlas cedar)')).toBeInTheDocument()
    expect(screen.getByText('Pinus halepensis')).toBeInTheDocument()
  })

  it('shows no species found message when results empty', async () => {
    mockUseTreeSearch.mockReturnValue({
      data: [],
      isFetching: false,
    })

    const user = userEvent.setup()
    render(<TreeSearchInput onSelect={vi.fn()} />, { wrapper: createWrapper() })

    await user.type(screen.getByTestId('tree-search-input'), 'zz')

    await waitFor(() => {
      expect(screen.getByText('No species found')).toBeInTheDocument()
    })
  })

  it('calls onSelect with scientific name when result is clicked', async () => {
    const onSelect = vi.fn()

    mockUseTreeSearch.mockReturnValue({
      data: [{ id: 1, name: 'Cedrus atlantica', commonName: 'Atlas cedar', rank: 'species' }],
      isFetching: false,
    })

    const user = userEvent.setup()
    render(<TreeSearchInput onSelect={onSelect} />, { wrapper: createWrapper() })

    await user.type(screen.getByTestId('tree-search-input'), 'ce')

    await waitFor(() => {
      expect(screen.getByTestId('tree-search-result-1')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('tree-search-result-1'))

    expect(onSelect).toHaveBeenCalledWith('Cedrus atlantica')
  })

  it('closes dropdown when clicking outside', async () => {
    mockUseTreeSearch.mockReturnValue({
      data: [{ id: 1, name: 'Cedrus atlantica', commonName: 'Atlas cedar', rank: 'species' }],
      isFetching: false,
    })

    const user = userEvent.setup()
    render(
      <div>
        <TreeSearchInput onSelect={vi.fn()} />
        <div data-testid="outside" />
      </div>,
      { wrapper: createWrapper() },
    )

    await user.type(screen.getByTestId('tree-search-input'), 'ce')

    await waitFor(() => {
      expect(screen.getByTestId('tree-search-dropdown')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(screen.queryByTestId('tree-search-dropdown')).not.toBeInTheDocument()
    })
  })
})
