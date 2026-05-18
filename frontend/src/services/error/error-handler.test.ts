import { describe, it, expect } from 'vitest'
import { normalizeAuthError } from './error-handler'

describe('normalizeAuthError', () => {
  it('maps known error codes to friendly messages', () => {
    const error = normalizeAuthError({
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'Invalid email or password',
      status: 401,
    })

    expect(error.message).toBe('Invalid email or password')
    expect(error.code).toBe('INVALID_EMAIL_OR_PASSWORD')
    expect(error.category).toBe('auth')
    expect(error.status).toBe(401)
  })

  it('uses raw message when code is unknown', () => {
    const error = normalizeAuthError({
      code: 'SOME_NEW_CODE',
      message: 'Something went wrong',
    })

    expect(error.message).toBe('Something went wrong')
    expect(error.code).toBe('SOME_NEW_CODE')
    expect(error.category).toBe('auth')
  })

  it('falls back to default message when no code or message', () => {
    const error = normalizeAuthError({})

    expect(error.message).toBe('Authentication failed')
    expect(error.code).toBe('')
    expect(error.category).toBe('auth')
  })

  it('always returns auth category', () => {
    const error = normalizeAuthError({ message: 'test' })
    expect(error.category).toBe('auth')
  })

  it('handles USER_ALREADY_EXISTS code', () => {
    const error = normalizeAuthError({ code: 'USER_ALREADY_EXISTS' })
    expect(error.message).toBe('An account with this email already exists')
  })

  it('handles RATE_LIMIT_EXCEEDED code', () => {
    const error = normalizeAuthError({ code: 'RATE_LIMIT_EXCEEDED' })
    expect(error.message).toBe('Too many attempts. Please try again later')
  })
})
