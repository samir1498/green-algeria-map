import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAll, getById, getByZoneId, create, updateStatus, remove } from './damage-reports'
import type { DamageReport } from '@/shared/types/damage-report'

const mockGet = vi.hoisted(() => vi.fn())
const mockPost = vi.hoisted(() => vi.fn())
const mockPatch = vi.hoisted(() => vi.fn())
const mockDelete = vi.hoisted(() => vi.fn())

vi.mock('@/shared/lib/axios', () => ({
  api: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}))

const mockReport: DamageReport = {
  id: '1',
  zoneId: 'zone-1',
  type: 'fire',
  severity: 'medium',
  status: 'reported',
  lat: 36.5,
  lng: 3.0,
  description: 'Fire damage',
  reportedBy: 'Volunteer-42',
  reportedAt: '2026-05-21T12:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('damage-reports API', () => {
  it('getAll calls GET /damage-reports', async () => {
    mockGet.mockResolvedValueOnce({ data: [mockReport] })
    const result = await getAll()
    expect(mockGet).toHaveBeenCalledWith('/api/damage-reports')
    expect(result).toEqual([mockReport])
  })

  it('getById calls GET /damage-reports/:id', async () => {
    mockGet.mockResolvedValueOnce({ data: mockReport })
    const result = await getById('1')
    expect(mockGet).toHaveBeenCalledWith('/api/damage-reports/1')
    expect(result).toEqual(mockReport)
  })

  it('getByZoneId calls GET /zones/:zoneId/damage-reports', async () => {
    mockGet.mockResolvedValueOnce({ data: [mockReport] })
    const result = await getByZoneId('zone-1')
    expect(mockGet).toHaveBeenCalledWith('/api/zones/zone-1/damage-reports')
    expect(result).toEqual([mockReport])
  })

  it('create calls POST /damage-reports', async () => {
    const input = {
      zoneId: 'zone-1',
      type: 'fire' as const,
      severity: 'medium' as const,
      status: 'reported' as const,
      lat: 36.5,
      lng: 3.0,
      description: 'Fire damage',
      reportedBy: 'Volunteer-42',
    }
    mockPost.mockResolvedValueOnce({ data: mockReport })
    const result = await create(input)
    expect(mockPost).toHaveBeenCalledWith('/api/damage-reports', input)
    expect(result).toEqual(mockReport)
  })

  it('updateStatus calls PATCH /damage-reports/:id/status', async () => {
    mockPatch.mockResolvedValueOnce({ data: { ...mockReport, status: 'verified' } })
    const result = await updateStatus('1', 'verified')
    expect(mockPatch).toHaveBeenCalledWith('/api/damage-reports/1/status', { status: 'verified' })
    expect(result.status).toBe('verified')
  })

  it('remove calls DELETE /damage-reports/:id', async () => {
    mockDelete.mockResolvedValueOnce({})
    await remove('1')
    expect(mockDelete).toHaveBeenCalledWith('/api/damage-reports/1')
  })
})
