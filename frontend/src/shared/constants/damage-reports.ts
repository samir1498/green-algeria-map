import type { DamageReport } from '@/shared/types/damage-report'

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
