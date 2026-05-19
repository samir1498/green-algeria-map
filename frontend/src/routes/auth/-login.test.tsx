import { describe, it, expect, vi, beforeEach, afterAll, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { Route } from './login'
import { renderWithRouter } from '@/test/render-with-router'

const mockSignIn = vi.fn().mockResolvedValue({ data: { user: {} }, error: null })
const mockNavigate = vi.fn()

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

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
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
  it('renders email and password fields', async () => {
    await renderWithRouter(Route.options.component as React.ReactElement)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows sign up link', async () => {
    await renderWithRouter(Route.options.component as React.ReactElement)

    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/auth/register',
    )
  })

  it('calls signIn with form values on submit', async () => {
    const { user } = await renderWithRouter(Route.options.component as React.ReactElement)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

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

    const { user } = await renderWithRouter(Route.options.component as React.ReactElement)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
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

    const { user } = await renderWithRouter(Route.options.component as React.ReactElement)

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Invalid email or password',
      )
    })
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled()
  })

  it('shows success toast and redirects on success', async () => {
    mockSignIn.mockResolvedValueOnce({ data: { user: {} }, error: null })

    const { user } = await renderWithRouter(Route.options.component as React.ReactElement)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        'Signed in successfully',
      )
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })
})
