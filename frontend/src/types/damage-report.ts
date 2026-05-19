export interface DamageReport {
  id: string
  zoneId: string
  type: 'fire' | 'disease' | 'vandalism' | 'drought' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'verified' | 'resolved'
  lat: number
  lng: number
  description: string
  reportedBy: string
  reportedAt: string
  photoUrl?: string
}

export const damageTypeLabels: Record<DamageReport['type'], string> = {
  fire: 'Fire Damage',
  disease: 'Disease/Pest',
  vandalism: 'Vandalism',
  drought: 'Drought',
  other: 'Other',
}

export const severityLabels: Record<DamageReport['severity'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const statusLabels: Record<DamageReport['status'], string> = {
  reported: 'Reported',
  verified: 'Verified',
  resolved: 'Resolved',
}
