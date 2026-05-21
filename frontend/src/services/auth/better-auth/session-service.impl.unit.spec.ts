import { describe, it, expect, vi, beforeEach } from 'vitest'
import { betterAuthSessionService } from './session-service.impl'

const mockGetSession = vi.hoisted(() => vi.fn())
const mockUseSession = vi.hoisted(() => vi.fn())

vi.mock('./auth-client', () => ({
  authClient: {
    getSession: mockGetSession,
    useSession: mockUseSession,
  },
}))

const mockMappedSession = vi.hoisted(() => vi.fn())
vi.mock('./mappers/map-session', () => ({
  mapSession: mockMappedSession,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('betterAuthSessionService', () => {
  describe('getSession', () => {
    it('returns null when no user', async () => {
      mockGetSession.mockResolvedValueOnce({ data: null, error: null })
      const result = await betterAuthSessionService.getSession()
      expect(result).toBeNull()
    })

    it('returns null on error', async () => {
      mockGetSession.mockResolvedValueOnce({ data: {}, error: new Error('Auth error') })
      const result = await betterAuthSessionService.getSession()
      expect(result).toBeNull()
    })

    it('returns mapped session when user exists', async () => {
      mockGetSession.mockResolvedValueOnce({ data: { user: { id: '1' } }, error: null })
      mockMappedSession.mockReturnValueOnce({ user: { id: '1' } })
      const result = await betterAuthSessionService.getSession()
      expect(result).toEqual({ user: { id: '1' } })
    })
  })
})
