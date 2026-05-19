import { api } from '@/lib/axios'
import type { DamageReport } from '@/types/damage-report'

export async function getAll(): Promise<DamageReport[]> {
  const { data } = await api.get<DamageReport[]>('/damage-reports')
  return data
}

export async function getById(id: string): Promise<DamageReport> {
  const { data } = await api.get<DamageReport>(`/damage-reports/${id}`)
  return data
}

export async function getByZoneId(zoneId: string): Promise<DamageReport[]> {
  const { data } = await api.get<DamageReport[]>(`/zones/${zoneId}/damage-reports`)
  return data
}

export async function create(input: Omit<DamageReport, 'id' | 'reportedAt'>): Promise<DamageReport> {
  const { data } = await api.post<DamageReport>('/damage-reports', input)
  return data
}

export async function updateStatus(
  id: string,
  status: DamageReport['status'],
): Promise<DamageReport> {
  const { data } = await api.patch<DamageReport>(`/damage-reports/${id}/status`, { status })
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/damage-reports/${id}`)
}