import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { renderAuthRoute } from '@/shared/test/render-with-router'
import { sanitizeRedirect } from '@/shared/utils/sanitize-redirect'
import { RegisterPage } from './register'

const mockSignUp = vi.fn().mockResolvedValue({ data: { user: {} }, error: null })

const validateSearch = (search: Record<string, unknown>): Record<string, unknown> =>
  typeof search.redirect === 'string' ? { redirect: sanitizeRedirect(search.redirect) } : {}

async function renderRegisterPage(options?: { initialEntries?: string[] }) {
  return renderAuthRoute('/auth/register', <RegisterPage />, {
    validateSearch,
    ...options,
  })
}

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSignUp.mockResolvedValue({ data: { user: {} }, error: null })
})

afterEach(() => {
  cleanup()
})

describe('RegisterPage', () => {
  it('renders form with all inputs and button', async () => {
    await renderRegisterPage()

    expect(screen.getByTestId('name-input')).toBeInTheDocument()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    expect(screen.getByTestId('sign-in-link')).toBeInTheDocument()
  })

  it('shows sign in link', async () => {
    await renderRegisterPage()

    expect(screen.getByTestId('sign-in-link')).toHaveAttribute('href', '/auth/login')
  })

  it('calls signUp with form values on submit', async () => {
    const { user } = await renderRegisterPage()

    await user.type(screen.getByTestId('name-input'), 'Test User')
    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    expect(mockSignUp).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('shows loading state while signing up', async () => {
    mockSignUp.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { user: {} }, error: null }), 100),
        ),
    )

    const { user } = await renderRegisterPage()

    await user.type(screen.getByTestId('name-input'), 'Test User')
    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    expect(screen.getByTestId('submit-button')).toBeDisabled()
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Creating account...')
  })

  it('shows error toast and re-enables button on failure', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Email already in use',
        code: 'EMAIL_ALREADY_EXISTS',
        category: 'auth',
      },
    })

    const { user } = await renderRegisterPage()

    await user.type(screen.getByTestId('name-input'), 'Test User')
    await user.type(screen.getByTestId('email-input'), 'existing@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Email already in use')
    })
    expect(screen.getByTestId('submit-button')).not.toBeDisabled()
  })

  it('shows success toast and redirects to home by default', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: {} }, error: null })

    const { user, router } = await renderRegisterPage()

    await user.type(screen.getByTestId('name-input'), 'Test User')
    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Account created successfully')
    })
    expect(router.state.location.href).toBe('/')
  })

  it('redirects to redirect query target on success', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: {} }, error: null })

    const { user, router } = await renderRegisterPage({
      initialEntries: ['/auth/register?redirect=%2Fdashboard'],
    })

    await user.type(screen.getByTestId('name-input'), 'Test User')
    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(router.state.location.href).toBe('/dashboard')
    })
  })

  it('falls back to home for unsafe redirect targets', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: {} }, error: null })

    const { user, router } = await renderRegisterPage({
      initialEntries: ['/auth/register?redirect=http%3A%2F%2Fevil.com'],
    })

    await user.type(screen.getByTestId('name-input'), 'Test User')
    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(router.state.location.href).toBe('/')
    })
  })
})
