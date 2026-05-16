export interface Zone {
  id: string
  name: string
  type: 'planting' | 'trash' | 'cleanup'
  status: 'planned' | 'in-progress' | 'completed'
  lat: number
  lng: number
  targetCount?: number
  currentCount?: number
  description: string
}
