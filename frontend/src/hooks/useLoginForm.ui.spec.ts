import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useLoginForm } from './useLoginForm'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockSignIn = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('useLoginForm', () => {
  it('initializes with empty fields', () => {
    const { result } = renderHook(() => useLoginForm({ signIn: mockSignIn }))

    expect(result.current.email).toBe('')
    expect(result.current.password).toBe('')
    expect(result.current.loading).toBe(false)
  })

  it('updates email and password via setters', () => {
    const { result } = renderHook(() => useLoginForm({ signIn: mockSignIn }))

    act(() => result.current.setEmail('test@example.com'))
    act(() => result.current.setPassword('password123'))

    expect(result.current.email).toBe('test@example.com')
    expect(result.current.password).toBe('password123')
  })

  it('calls signIn and navigates on success', async () => {
    mockSignIn.mockResolvedValueOnce({ data: { user: {} }, error: null })
    const { result } = renderHook(() => useLoginForm({ signIn: mockSignIn }))

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent
    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(mockSignIn).toHaveBeenCalledWith({ email: '', password: '' })
    const { toast } = await import('sonner')
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Signed in successfully')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('shows error toast and does not navigate on failure', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    })
    const { result } = renderHook(() => useLoginForm({ signIn: mockSignIn }))

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent
    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    const { toast } = await import('sonner')
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Invalid credentials')
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('resets loading to false after submission completes', async () => {
    mockSignIn.mockResolvedValueOnce({ data: { user: {} }, error: null })
    const { result } = renderHook(() => useLoginForm({ signIn: mockSignIn }))

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent
    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(result.current.loading).toBe(false)
  })
})
