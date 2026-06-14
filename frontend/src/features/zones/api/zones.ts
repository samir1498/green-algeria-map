import { api } from '@/shared/lib/axios'
import type { Zone } from '@/shared/types/zone'

export async function getAll(): Promise<Zone[]> {
  const { data } = await api.get<Zone[]>('/api/zones')
  return data
}

export async function getById(id: string): Promise<Zone> {
  const { data } = await api.get<Zone>(`/api/zones/${id}`)
  return data
}

export async function create(input: Omit<Zone, 'id'>): Promise<Zone> {
  const { data } = await api.post<Zone>('/api/zones', input)
  return data
}

export async function update(id: string, input: Partial<Zone>): Promise<Zone> {
  const { data } = await api.patch<Zone>(`/api/zones/${id}`, input)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/api/zones/${id}`)
}

export async function registerVolunteer(id: string): Promise<void> {
  await api.post(`/api/zones/${id}/volunteer`)
}
