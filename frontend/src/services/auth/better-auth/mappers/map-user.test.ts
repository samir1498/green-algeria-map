import { describe, it, expect } from 'vitest'
import { mapUser } from './map-user'

const validRaw = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
  role: 'volunteer',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

describe('mapUser', () => {
  it('maps valid raw data to AuthUser', () => {
    const user = mapUser(validRaw)

    expect(user.id).toBe('user-1')
    expect(user.name).toBe('Test User')
    expect(user.email).toBe('test@example.com')
    expect(user.emailVerified).toBe(true)
    expect(user.role).toBe('volunteer')
    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.updatedAt).toBeInstanceOf(Date)
  })

  it('accepts Date instances for createdAt and updatedAt', () => {
    const raw = {
      ...validRaw,
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-01'),
    }

    const user = mapUser(raw)
    expect(user.createdAt.getFullYear()).toBe(2024)
    expect(user.updatedAt.getFullYear()).toBe(2024)
  })

  it('defaults role to volunteer when missing', () => {
    const raw = { ...validRaw, role: undefined }
    expect(mapUser(raw).role).toBe('volunteer')
  })

  it('defaults role to volunteer when invalid', () => {
    const raw = { ...validRaw, role: 'superadmin' }
    expect(mapUser(raw).role).toBe('volunteer')
  })

  it('accepts all valid roles', () => {
    ;(['volunteer', 'reporter', 'organizer', 'admin'] as const).forEach((role) => {
      expect(mapUser({ ...validRaw, role }).role).toBe(role)
    })
  })

  it('handles null image', () => {
    const user = mapUser({ ...validRaw, image: null })
    expect(user.image).toBeUndefined()
  })

  it('handles undefined image', () => {
    const user = mapUser({ ...validRaw, image: undefined })
    expect(user.image).toBeUndefined()
  })

  it('passes through string image', () => {
    const user = mapUser({ ...validRaw, image: 'https://example.com/avatar.jpg' })
    expect(user.image).toBe('https://example.com/avatar.jpg')
  })

  it('throws when id is missing', () => {
    expect(() => mapUser({ ...validRaw, id: undefined })).toThrow('mapUser: id is required')
  })

  it('throws when name is missing', () => {
    expect(() => mapUser({ ...validRaw, name: undefined })).toThrow('mapUser: name is required')
  })

  it('throws when email is missing', () => {
    expect(() => mapUser({ ...validRaw, email: undefined })).toThrow('mapUser: email is required')
  })

  it('throws when emailVerified is missing', () => {
    expect(() => mapUser({ ...validRaw, emailVerified: undefined })).toThrow(
      'mapUser: emailVerified is required',
    )
  })

  it('throws when image is invalid type', () => {
    expect(() => mapUser({ ...validRaw, image: 123 as unknown })).toThrow(
      'mapUser: image must be a string or null',
    )
  })

  it('throws when createdAt is invalid', () => {
    expect(() => mapUser({ ...validRaw, createdAt: 'not-a-date' })).toThrow(
      'mapUser: invalid createdAt',
    )
  })

  it('throws when updatedAt is invalid', () => {
    expect(() => mapUser({ ...validRaw, updatedAt: 'not-a-date' })).toThrow(
      'mapUser: invalid updatedAt',
    )
  })
})
