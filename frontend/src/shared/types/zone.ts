export interface Zone {
  id: string
  name: string
  type: 'planting' | 'trash' | 'cleanup'
  status: 'planned' | 'in-progress' | 'completed'
  lat: number
  lng: number
  targetCount?: number | null
  currentCount?: number | null
  description: string
  treeSpecies?: string | null
  organizerContact?: string | null
  volunteerCount: number
}
