export const ZONE_TYPES = ['planting', 'trash', 'cleanup'] as const;
export type ZoneType = (typeof ZONE_TYPES)[number];

export const ZONE_STATUSES = ['planned', 'in-progress', 'completed'] as const;
export type ZoneStatus = (typeof ZONE_STATUSES)[number];
