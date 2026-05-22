import { describe, it, expect } from 'vitest'
import { mapSession } from './map-session'

describe('mapSession', () => {
  it('maps user and session data', () => {
    const raw = {
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        role: 'volunteer',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      session: {
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date('2027-01-01'),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
    }

    const result = mapSession(raw)
    expect(result.user.id).toBe('user-1')
    expect(result.user.name).toBe('Test User')
    expect(result.user.email).toBe('test@example.com')
    expect(result.user.role).toBe('volunteer')
  })
})
