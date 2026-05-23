import type { Zone } from '@/shared/types/zone'
import type { DamageReport } from '@/shared/types/damage-report'

export const statusColors: Record<Zone['status'], string> = {
  planned: '#f59e0b',
  'in-progress': '#3b82f6',
  completed: '#22c55e',
}

export const typeLabels: Record<Zone['type'], string> = {
  planting: 'Tree Planting',
  trash: 'Trash Cleanup',
  cleanup: 'General Cleanup',
}

export const statusBadgeClasses: Record<Zone['status'], string> = {
  planned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export const damageSeverityColors: Record<DamageReport['severity'], string> = {
  low: '#f97316',
  medium: '#ef4444',
  high: '#dc2626',
  critical: '#991b1b',
}

export const damageStatusBadgeClasses: Record<DamageReport['status'], string> = {
  reported: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  verified: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  resolved: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
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

export const legendItems = [
  { label: 'Planned', color: statusColors.planned },
  { label: 'In Progress', color: statusColors['in-progress'] },
  { label: 'Completed', color: statusColors.completed },
  { label: 'Damage Report', color: damageSeverityColors.critical },
] as const

export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}
