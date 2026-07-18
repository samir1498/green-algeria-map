// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useRegisterForm } from './useRegisterForm'

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

const mockSignUp = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('useRegisterForm', () => {
  it('initializes with empty fields', () => {
    const { result } = renderHook(() => useRegisterForm({ signUp: mockSignUp }))

    expect(result.current.name).toBe('')
    expect(result.current.email).toBe('')
    expect(result.current.password).toBe('')
    expect(result.current.loading).toBe(false)
  })

  it('calls signUp and navigates on success', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: { emailVerified: true } }, error: null })
    const { result } = renderHook(() => useRegisterForm({ signUp: mockSignUp }))

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent
    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(mockSignUp).toHaveBeenCalledWith({ name: '', email: '', password: '' })
    const { toast } = await import('sonner')
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Account created successfully')
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('shows error toast on failure', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email already in use' },
    })
    const { result } = renderHook(() => useRegisterForm({ signUp: mockSignUp }))

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent
    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    const { toast } = await import('sonner')
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Email already in use')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('resets loading to false after submission completes', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: {} }, error: null })
    const { result } = renderHook(() => useRegisterForm({ signUp: mockSignUp }))

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent
    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(result.current.loading).toBe(false)
  })
})
