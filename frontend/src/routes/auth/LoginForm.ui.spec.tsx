import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { LoginPage } from './login'
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createTestQueryClient } from '@/shared/test/render-with-router'
import userEvent from '@testing-library/user-event'

const mockSignIn = vi.fn().mockResolvedValue({ data: { user: {} }, error: null })

vi.mock('@/features/auth/hooks/useAuth', () => ({
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

vi.mock('@/features/auth/api', () => ({
  sessionService: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSignIn.mockResolvedValue({ data: { user: {} }, error: null })
})

afterEach(() => {
  cleanup()
})

async function renderLoginPage() {
  const auth = { user: null, isAuthenticated: false, isPending: false }
  const rootRoute = createRootRouteWithContext<{ auth: typeof auth }>()({
    component: () => <Outlet />,
  })

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/auth/login',
    component: LoginPage,
  })

  const routeTree = rootRoute.addChildren([loginRoute])
  const history = createMemoryHistory({ initialEntries: ['/auth/login'] })
  const router = createRouter({ routeTree, history, context: { auth }, defaultPendingMs: 0 })

  await router.load()

  const queryClient = createTestQueryClient()
  const { rerender, unmount, container } = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return {
    user: userEvent.setup(),
    rerender,
    unmount,
    container,
    router,
  }
}

describe('LoginPage', () => {
  it('renders form with all inputs and button', async () => {
    await renderLoginPage()

    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    expect(screen.getByTestId('sign-up-link')).toBeInTheDocument()
  })

  it('shows sign up link', async () => {
    await renderLoginPage()

    expect(screen.getByTestId('sign-up-link')).toHaveAttribute('href', '/auth/register')
  })

  it('calls signIn with form values on submit', async () => {
    const { user } = await renderLoginPage()

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

    const { user } = await renderLoginPage()

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

    const { user } = await renderLoginPage()

    await user.type(screen.getByTestId('email-input'), 'wrong@example.com')
    await user.type(screen.getByTestId('password-input'), 'wrong')
    await user.click(screen.getByTestId('submit-button'))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Invalid email or password')
    })
    expect(screen.getByTestId('submit-button')).not.toBeDisabled()
  })

  it('shows success toast and redirects on success', async () => {
    mockSignIn.mockResolvedValueOnce({ data: { user: {} }, error: null })

    const { user, router } = await renderLoginPage()

    await user.type(screen.getByTestId('email-input'), 'test@example.com')
    await user.type(screen.getByTestId('password-input'), 'password123')
    await user.click(screen.getByTestId('submit-button'))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Signed in successfully')
    })
    expect(router.state.location.href).toBe('/')
  })
})
