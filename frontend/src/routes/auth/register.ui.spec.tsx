import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { RegisterPage } from './register'
import { renderWithRouter } from '@/shared/test/render-with-router'

const mockSignUp = vi.fn().mockResolvedValue({ data: { user: {} }, error: null })

vi.mock('@/features/auth/api', () => ({
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
    await renderWithRouter(<RegisterPage />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('has a link to sign in', async () => {
    await renderWithRouter(<RegisterPage />)

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login')
  })

  it('calls signUp with form values on submit', async () => {
    const { user } = await renderWithRouter(<RegisterPage />)

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

    const { user } = await renderWithRouter(<RegisterPage />)

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
    const { user, router } = await renderWithRouter(<RegisterPage />)

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
