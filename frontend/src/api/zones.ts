import { api } from '@/lib/axios'
import type { Zone } from '@/types/zone'

export async function getAll(): Promise<Zone[]> {
  const { data } = await api.get<Zone[]>('/zones')
  return data
}

export async function getById(id: string): Promise<Zone> {
  const { data } = await api.get<Zone>(`/zones/${id}`)
  return data
}

export async function create(input: Omit<Zone, 'id'>): Promise<Zone> {
  const { data } = await api.post<Zone>('/zones', input)
  return data
}

export async function update(id: string, input: Partial<Zone>): Promise<Zone> {
  const { data } = await api.patch<Zone>(`/zones/${id}`, input)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/zones/${id}`)
}
