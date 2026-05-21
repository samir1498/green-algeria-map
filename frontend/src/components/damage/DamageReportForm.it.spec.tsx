import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, render, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { DamageReportForm } from './DamageReportForm'

const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('@/api/damage-reports', () => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  getByZoneId: vi.fn(),
  create: mockCreate,
  updateStatus: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DamageReportForm', () => {
  it('renders all form fields and submit button', () => {
    render(<DamageReportForm zoneId="zone-1" lat={36.5} lng={3.0} />, { wrapper: createWrapper() })

    expect(screen.getByTestId('damage-type-select')).toBeInTheDocument()
    expect(screen.getByTestId('severity-select')).toBeInTheDocument()
    expect(screen.getByTestId('description-input')).toBeInTheDocument()
    expect(screen.getByTestId('reported-by-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-report-button')).toBeInTheDocument()
  })

  it('calls create with correct payload on submit', async () => {
    mockCreate.mockResolvedValueOnce({})
    const user = userEvent.setup()
    render(<DamageReportForm zoneId="zone-1" lat={36.5} lng={3.0} />, { wrapper: createWrapper() })

    await user.type(screen.getByTestId('description-input'), 'Fire damage in sector A')
    await user.type(screen.getByTestId('reported-by-input'), 'Volunteer-42')
    await user.click(screen.getByTestId('submit-report-button'))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        zoneId: 'zone-1',
        type: 'fire',
        severity: 'medium',
        status: 'reported',
        lat: 36.5,
        lng: 3.0,
        description: 'Fire damage in sector A',
        reportedBy: 'Volunteer-42',
      })
    })
  })

  it('shows success toast and resets form on successful submit', async () => {
    mockCreate.mockResolvedValueOnce({})
    const user = userEvent.setup()
    render(<DamageReportForm zoneId="zone-1" lat={36.5} lng={3.0} />, { wrapper: createWrapper() })

    await user.type(screen.getByTestId('description-input'), 'Fire damage')
    await user.type(screen.getByTestId('reported-by-input'), 'Volunteer-42')
    await user.click(screen.getByTestId('submit-report-button'))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Damage report submitted')
    })

    expect(screen.getByTestId('description-input')).toHaveValue('')
    expect(screen.getByTestId('reported-by-input')).toHaveValue('')
  })

  it('shows validation error when required field is empty after user interaction', async () => {
    const user = userEvent.setup()
    render(<DamageReportForm zoneId="zone-1" lat={36.5} lng={3.0} />, { wrapper: createWrapper() })

    const descInput = screen.getByTestId('description-input')
    await user.type(descInput, 'Some text')
    await user.clear(descInput)

    expect(screen.getByText('Description is required')).toBeInTheDocument()
  })

  it('shows error toast and keeps form open on API failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network error'))
    const user = userEvent.setup()
    render(<DamageReportForm zoneId="zone-1" lat={36.5} lng={3.0} />, { wrapper: createWrapper() })

    await user.type(screen.getByTestId('description-input'), 'Fire damage')
    await user.type(screen.getByTestId('reported-by-input'), 'Volunteer-42')
    await user.click(screen.getByTestId('submit-report-button'))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Failed to submit damage report')
    })

    expect(screen.getByTestId('submit-report-button')).not.toBeDisabled()
  })

  it('disables button and shows Submitting... while submitting', async () => {
    let resolvePromise: (value: unknown) => void
    const submitPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockCreate.mockReturnValueOnce(submitPromise)

    const user = userEvent.setup()
    render(<DamageReportForm zoneId="zone-1" lat={36.5} lng={3.0} />, { wrapper: createWrapper() })

    await user.type(screen.getByTestId('description-input'), 'Fire damage')
    await user.type(screen.getByTestId('reported-by-input'), 'Volunteer-42')
    await user.click(screen.getByTestId('submit-report-button'))

    expect(screen.getByTestId('submit-report-button')).toBeDisabled()
    expect(screen.getByTestId('submit-report-button')).toHaveTextContent('Submitting...')

    resolvePromise!({})
    await waitFor(() => {
      expect(screen.getByTestId('submit-report-button')).not.toBeDisabled()
    })
  })
})
