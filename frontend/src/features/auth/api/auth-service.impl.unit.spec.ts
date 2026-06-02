import { describe, it, expect, vi, beforeEach } from 'vitest'
import { betterAuthService } from './auth-service.impl'

const mockSignInEmail = vi.hoisted(() => vi.fn())
const mockSignUpEmail = vi.hoisted(() => vi.fn())
const mockSignOut = vi.hoisted(() => vi.fn())

vi.mock('./auth-client', () => ({
  authClient: {
    signIn: { email: mockSignInEmail },
    signUp: { email: mockSignUpEmail },
    signOut: mockSignOut,
  },
}))

const mockMapUser = vi.hoisted(() => vi.fn())
vi.mock('./map-user', () => ({
  mapUser: mockMapUser,
}))

vi.mock('./error-handler', () => ({
  normalizeAuthError: (e: any) => ({
    message: e.message,
    code: e.code ?? 'UNKNOWN',
    category: 'auth',
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('betterAuthService', () => {
  describe('signIn', () => {
    it('returns user on success', async () => {
      mockSignInEmail.mockResolvedValueOnce({ data: { user: { id: '1' } }, error: null })
      mockMapUser.mockReturnValueOnce({ id: '1', name: 'Test' })
      const result = await betterAuthService.signIn({ email: 'test@example.com', password: 'pass' })
      expect(result.data?.user).toEqual({ id: '1', name: 'Test' })
      expect(result.error).toBeNull()
    })

    it('returns error when sign in fails', async () => {
      mockSignInEmail.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
      })
      const result = await betterAuthService.signIn({
        email: 'test@example.com',
        password: 'wrong',
      })
      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Invalid credentials')
    })

    it('returns error when user is missing', async () => {
      mockSignInEmail.mockResolvedValueOnce({ data: { user: null }, error: null })
      const result = await betterAuthService.signIn({ email: 'test@example.com', password: 'pass' })
      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Sign in failed')
    })
  })

  describe('signUp', () => {
    it('returns user on success', async () => {
      mockSignUpEmail.mockResolvedValueOnce({ data: { user: { id: '1' } }, error: null })
      mockMapUser.mockReturnValueOnce({ id: '1', name: 'New User' })
      const result = await betterAuthService.signUp({
        name: 'New User',
        email: 'new@example.com',
        password: 'pass',
      })
      expect(result.data?.user).toEqual({ id: '1', name: 'New User' })
    })

    it('returns error on failure', async () => {
      mockSignUpEmail.mockResolvedValueOnce({ data: null, error: { message: 'Email taken' } })
      const result = await betterAuthService.signUp({
        name: 'New User',
        email: 'taken@example.com',
        password: 'pass',
      })
      expect(result.error?.message).toBe('Email taken')
    })
  })

  describe('signOut', () => {
    it('returns null error on success', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null })
      const result = await betterAuthService.signOut()
      expect(result.error).toBeNull()
    })

    it('returns error on failure', async () => {
      mockSignOut.mockResolvedValueOnce({ error: { message: 'Sign out failed' } })
      const result = await betterAuthService.signOut()
      expect(result.error?.message).toBe('Sign out failed')
    })
  })
})
