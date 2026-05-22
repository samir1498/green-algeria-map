import { describe, it, expect } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('formats a Date object', () => {
    const date = new Date(2026, 4, 21)
    expect(formatDate(date)).toBe('5/21/2026')
  })

  it('formats an ISO date string', () => {
    expect(formatDate('2026-05-21T12:00:00Z')).toBe('5/21/2026')
  })

  it('returns a string', () => {
    expect(typeof formatDate('2026-01-01')).toBe('string')
  })
})
