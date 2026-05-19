export type DamageReport = {
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
}