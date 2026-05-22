import { describe, it, expect } from 'vitest'
import { isValidCoordinate } from './helpers'

describe('isValidCoordinate', () => {
  it('returns true for valid coordinates', () => {
    expect(isValidCoordinate(36.5, 3.0)).toBe(true)
  })

  it('returns true for edge values', () => {
    expect(isValidCoordinate(-90, -180)).toBe(true)
    expect(isValidCoordinate(90, 180)).toBe(true)
    expect(isValidCoordinate(0, 0)).toBe(true)
  })

  it('returns false for lat below -90', () => {
    expect(isValidCoordinate(-91, 0)).toBe(false)
  })

  it('returns false for lat above 90', () => {
    expect(isValidCoordinate(91, 0)).toBe(false)
  })

  it('returns false for lng below -180', () => {
    expect(isValidCoordinate(0, -181)).toBe(false)
  })

  it('returns false for lng above 180', () => {
    expect(isValidCoordinate(0, 181)).toBe(false)
  })

  it('returns false when both lat and lng are invalid', () => {
    expect(isValidCoordinate(-100, 200)).toBe(false)
  })
})
