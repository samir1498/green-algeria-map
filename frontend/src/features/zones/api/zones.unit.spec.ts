import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAll, getById, create, update, remove } from './zones'
import type { Zone } from '@/shared/types/zone'

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

const mockZones: Zone[] = [
  {
    id: '1',
    name: 'Zone A',
    type: 'planting',
    status: 'completed',
    lat: 36.5,
    lng: 3.0,
    description: '',
  },
  {
    id: '2',
    name: 'Zone B',
    type: 'trash',
    status: 'planned',
    lat: 36.6,
    lng: 3.1,
    description: '',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('zones API', () => {
  it('getAll calls GET /zones and returns zones', async () => {
    mockGet.mockResolvedValueOnce({ data: mockZones })
    const result = await getAll()
    expect(mockGet).toHaveBeenCalledWith('/zones')
    expect(result).toEqual(mockZones)
  })

  it('getById calls GET /zones/:id', async () => {
    mockGet.mockResolvedValueOnce({ data: mockZones[0] })
    const result = await getById('1')
    expect(mockGet).toHaveBeenCalledWith('/zones/1')
    expect(result).toEqual(mockZones[0])
  })

  it('create calls POST /zones with input', async () => {
    const input: Omit<Zone, 'id'> = {
      name: 'New Zone',
      type: 'planting',
      status: 'planned',
      lat: 36,
      lng: 3,
      description: '',
    }
    mockPost.mockResolvedValueOnce({ data: { id: '3', ...input } })
    const result = await create(input)
    expect(mockPost).toHaveBeenCalledWith('/zones', input)
    expect(result).toEqual({ id: '3', ...input })
  })

  it('update calls PATCH /zones/:id with partial input', async () => {
    mockPatch.mockResolvedValueOnce({ data: { ...mockZones[0], name: 'Updated' } })
    const result = await update('1', { name: 'Updated' })
    expect(mockPatch).toHaveBeenCalledWith('/zones/1', { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })

  it('remove calls DELETE /zones/:id', async () => {
    mockDelete.mockResolvedValueOnce({})
    await remove('1')
    expect(mockDelete).toHaveBeenCalledWith('/zones/1')
  })
})
