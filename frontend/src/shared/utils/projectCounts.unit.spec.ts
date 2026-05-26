import { describe, it, expect } from 'vitest'
import { computeProjectCounts } from './projectCounts'
import type { Zone } from '@/shared/types/zone'

const plantingZone: Zone = {
  id: '1',
  name: 'Zone A',
  type: 'planting',
  status: 'completed',
  lat: 36.5,
  lng: 3.0,
  currentCount: 10,
  targetCount: 20,
  description: '',
  volunteerCount: 0,
}

const trashZone: Zone = {
  id: '2',
  name: 'Zone B',
  type: 'trash',
  status: 'planned',
  lat: 36.6,
  lng: 3.1,
  description: '',
  volunteerCount: 0,
}

const cleanupZone: Zone = {
  id: '3',
  name: 'Zone C',
  type: 'cleanup',
  status: 'in-progress',
  lat: 36.7,
  lng: 3.2,
  description: '',
  volunteerCount: 0,
}

describe('computeProjectCounts', () => {
  it('counts total zones', () => {
    const result = computeProjectCounts([plantingZone, trashZone, cleanupZone])
    expect(result.total).toBe(3)
  })

  it('counts only planting zones', () => {
    const result = computeProjectCounts([plantingZone, trashZone, cleanupZone])
    expect(result.planting).toBe(1)
  })

  it('sums currentCount across all zones', () => {
    const result = computeProjectCounts([plantingZone, trashZone, cleanupZone])
    expect(result.trees).toBe(10)
  })

  it('sums targetCount across all zones', () => {
    const result = computeProjectCounts([plantingZone, trashZone, cleanupZone])
    expect(result.treeTarget).toBe(20)
  })

  it('handles zones with null counts', () => {
    const result = computeProjectCounts([trashZone, cleanupZone])
    expect(result.trees).toBe(0)
    expect(result.treeTarget).toBe(0)
  })

  it('returns zeros for empty array', () => {
    const result = computeProjectCounts([])
    expect(result.total).toBe(0)
    expect(result.planting).toBe(0)
    expect(result.trees).toBe(0)
    expect(result.treeTarget).toBe(0)
  })
})
