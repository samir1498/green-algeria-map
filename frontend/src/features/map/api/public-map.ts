import { api } from '@/shared/lib/axios'
import type { Zone } from '@/shared/types/zone'
import type { DamageReport } from '@/shared/types/damage-report'

export interface PublicMapResponse {
  zones: Zone[]
  damageReports: DamageReport[]
}

export async function getPublicMapData(): Promise<PublicMapResponse> {
  const { data } = await api.get<PublicMapResponse>('/api/public/map')
  return data
}
