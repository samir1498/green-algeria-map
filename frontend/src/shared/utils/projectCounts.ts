import type { Zone } from '@/shared/types/zone'

export interface ProjectCounts {
  total: number
  planting: number
  trees: number
  treeTarget: number
}

export function computeProjectCounts(zones: Zone[]): ProjectCounts {
  return {
    total: zones.length,
    planting: zones.filter((z) => z.type === 'planting').length,
    trees: zones.reduce((sum, z) => sum + (z.currentCount ?? 0), 0),
    treeTarget: zones.reduce((sum, z) => sum + (z.targetCount ?? 0), 0),
  }
}
