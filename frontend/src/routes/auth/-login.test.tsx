import { describe, it, expect, vi, beforeEach, afterAll, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { LoginPage } from './login'
import { renderWithRouter } from '@/test/render-with-router'

const mockSignIn = vi.fn().mockResolvedValue({ data: { user: {} }, error: null })

vi.mock('@/services/auth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const originalLocation = window.location

beforeEach(() => {
  vi.clearAllMocks()
  mockSignIn.mockResolvedValue({ data: { user: {} }, error: null })
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
  })
})

afterEach(() => {
  cleanup()
})

afterAll(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  })
})

describe('LoginPage', () => {
  it('renders form with all inputs and button', async () => {
    await renderWithRouter(<LoginPage />)

    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    expect(screen.getByTestId('sign-up-link')).toBeInTheDocument()
  })

  it('shows sign up link', async () => {
    await renderWithRouter(<LoginPage />)

    expect(screen.getByTestId('sign-up-link')).toHaveAttribute(
      'href',
      '/auth/register',
    )
  })

  it('calls signIn with form values on submit', async () => {
    const { user } = await renderWithRouter(<LoginPage />)

    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('shows loading state while signing in', async () => {
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { user: {} }, error: null }), 100),
        ),
    )

    const { user } = await renderWithRouter(<LoginPage />)

    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    expect(screen.getByTestId('submit-button')).toBeDisabled()
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Signing in...')
  })

  it('shows error toast and re-enables button on failure', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Invalid email or password',
        code: 'INVALID_EMAIL_OR_PASSWORD',
        category: 'auth',
      },
    })

    const { user } = await renderWithRouter(<LoginPage />)

    await user.type(screen.getByTestId('email-input'), 'wrong@example.com')
    await user.type(screen.getByTestId('password-input'), 'wrong')
    await user.click(screen.getByTestId('submit-button'))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Invalid email or password',
      )
    })
    expect(screen.getByTestId('submit-button')).not.toBeDisabled()
  })

  it('shows success toast and redirects on success', async () => {
    mockSignIn.mockResolvedValueOnce({ data: { user: {} }, error: null })

    const { user } = await renderWithRouter(<LoginPage />)

    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        'Signed in successfully',
      )
    })
    expect(window.location.href).toBe('/')
  })
})