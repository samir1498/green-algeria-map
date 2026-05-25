import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { RegisterPage } from './register'
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

const mockSignUp = vi.fn().mockResolvedValue({ data: { user: {} }, error: null })

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

vi.mock('@/features/auth/api', () => ({
  sessionService: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSignUp.mockResolvedValue({ data: { user: {} }, error: null })
})

afterEach(() => {
  cleanup()
})

async function renderRegisterPage() {
  const auth = { user: null, isAuthenticated: false, isPending: false }
  const rootRoute = createRootRouteWithContext<{ auth: typeof auth }>()({
    component: () => <Outlet />,
  })

  const registerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/auth/register',
    component: RegisterPage,
  })

  const routeTree = rootRoute.addChildren([registerRoute])
  const history = createMemoryHistory({ initialEntries: ['/auth/register'] })
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

describe('RegisterPage', () => {
  it('renders form with all inputs and button', async () => {
    await renderRegisterPage()

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('has a link to sign in', async () => {
    await renderRegisterPage()

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login')
  })

  it('calls signUp with form values on submit', async () => {
    const { user } = await renderRegisterPage()

    await user.type(screen.getByLabelText('Name'), 'New User')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(mockSignUp).toHaveBeenCalledWith({
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
    })
  })

  it('shows error toast on failure', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email already in use' },
    })

    const { user } = await renderRegisterPage()

    await user.type(screen.getByLabelText('Name'), 'New User')
    await user.type(screen.getByLabelText('Email'), 'taken@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Email already in use')
    })
  })

  it('shows success toast and redirects on success', async () => {
    const { user, router } = await renderRegisterPage()

    await user.type(screen.getByLabelText('Name'), 'New User')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    const { toast } = await import('sonner')
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Account created successfully')
    })
    expect(router.state.location.href).toBe('/')
  })
})
