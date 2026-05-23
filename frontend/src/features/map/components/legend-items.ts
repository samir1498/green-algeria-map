import { statusColors } from '@/shared/constants/zones'
import { damageSeverityColors } from '@/shared/constants/damage-reports'

export const legendItems = [
  { label: 'Planned', color: statusColors.planned },
  { label: 'In Progress', color: statusColors['in-progress'] },
  { label: 'Completed', color: statusColors.completed },
  { label: 'Damage Report', color: damageSeverityColors.critical },
] as const
