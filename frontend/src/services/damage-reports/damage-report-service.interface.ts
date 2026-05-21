import type { DamageReport } from '@/types/damage-report'

export interface DamageReportService {
  getAll(): Promise<DamageReport[]>
  getById(id: string): Promise<DamageReport>
  getByZoneId(zoneId: string): Promise<DamageReport[]>
  create(input: Omit<DamageReport, 'id' | 'reportedAt'>): Promise<DamageReport>
  updateStatus(id: string, status: DamageReport['status']): Promise<DamageReport>
  remove(id: string): Promise<void>
}
