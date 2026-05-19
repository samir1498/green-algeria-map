export const DAMAGE_REPORT_TYPES = [
  'fire',
  'disease',
  'vandalism',
  'drought',
  'other',
] as const;
export type DamageReportType = (typeof DAMAGE_REPORT_TYPES)[number];

export const DAMAGE_REPORT_SEVERITIES = [
  'low',
  'medium',
  'high',
  'critical',
] as const;
export type DamageReportSeverity = (typeof DAMAGE_REPORT_SEVERITIES)[number];

export const DAMAGE_REPORT_STATUSES = [
  'reported',
  'verified',
  'resolved',
] as const;
export type DamageReportStatus = (typeof DAMAGE_REPORT_STATUSES)[number];
