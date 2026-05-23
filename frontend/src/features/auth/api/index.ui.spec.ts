import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from './index'
import * as sessionModule from './session-service.impl'
import * as authModule from './auth-service.impl'

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
  role: 'volunteer' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

vi.mock('./session-service.impl', () => ({
  betterAuthSessionService: {
    useSession: vi.fn(),
  },
}))

vi.mock('./auth-service.impl', () => ({
  betterAuthService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}))

const mockUseSession = vi.mocked(sessionModule.betterAuthSessionService.useSession)
const mockAuthService = vi.mocked(authModule.betterAuthService)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAuth', () => {
  it('returns unauthenticated state when no session', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns authenticated state with user data', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.name).toBe('Test User')
  })

  it('returns pending state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isPending).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns error state', () => {
    const mockError = { message: 'Network error', code: 'ERR', category: 'auth' as const }
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: mockError,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.error).toEqual(mockError)
  })

  it('hasRole returns true for matching role', () => {
    mockUseSession.mockReturnValue({
      data: { user: { ...mockUser, role: 'admin' } },
      isPending: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('volunteer')).toBe(false)
  })

  it('hasRole returns false when no user', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.hasRole('admin')).toBe(false)
  })

  it('exposes signIn function from service', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.signIn).toBe(mockAuthService.signIn)
  })

  it('exposes signUp function from service', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.signUp).toBe(mockAuthService.signUp)
  })

  it('exposes signOut function from service', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.signOut).toBe(mockAuthService.signOut)
  })
})
