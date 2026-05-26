import { api } from '@/shared/lib/axios'
import type { Zone } from '@/shared/types/zone'
import type { DamageReport } from '@/shared/types/damage-report'

interface PublicMapResponse {
  zones: Zone[]
  damageReports: DamageReport[]
}

export async function getPublicMapData(): Promise<PublicMapResponse> {
  const { data } = await api.get<PublicMapResponse>('/public/map')
  return data
}
