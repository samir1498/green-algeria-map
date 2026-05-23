import type { Zone } from '@/shared/types/zone'

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
