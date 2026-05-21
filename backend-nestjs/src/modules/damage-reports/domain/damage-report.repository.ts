import { DamageReport } from './damage-report';

export abstract class DamageReportRepository {
  abstract findAll(): Promise<DamageReport[]>;
  abstract findById(id: string): Promise<DamageReport | null>;
  abstract findByZoneId(zoneId: string): Promise<DamageReport[]>;
  abstract save(report: DamageReport): Promise<DamageReport>;
  abstract remove(id: string): Promise<void>;
}
