import { describe, it, expect } from 'vitest'
import { sanitizeRedirect } from './sanitize-redirect'

describe('sanitizeRedirect', () => {
  it('returns the url for valid relative paths', () => {
    expect(sanitizeRedirect('/dashboard')).toBe('/dashboard')
    expect(sanitizeRedirect('/')).toBe('/')
    expect(sanitizeRedirect('/auth/login?redirect=/dashboard')).toBe(
      '/auth/login?redirect=/dashboard',
    )
  })

  it('returns "/" for non-string values', () => {
    expect(sanitizeRedirect(undefined)).toBe('/')
    expect(sanitizeRedirect(null)).toBe('/')
    expect(sanitizeRedirect(42)).toBe('/')
    expect(sanitizeRedirect({})).toBe('/')
  })

  it('returns "/" for external URLs', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe('/')
    expect(sanitizeRedirect('//evil.com')).toBe('/')
    expect(sanitizeRedirect('ftp://files')).toBe('/')
  })

  it('returns "/" for empty or malformed strings', () => {
    expect(sanitizeRedirect('')).toBe('/')
  })
})
