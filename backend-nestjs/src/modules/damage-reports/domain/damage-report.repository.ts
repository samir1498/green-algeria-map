export abstract class DamageReportRepository {
  abstract findAll(): Promise<import('./damage-report').DamageReport[]>;
  abstract findById(
    id: string,
  ): Promise<import('./damage-report').DamageReport | null>;
  abstract findByZoneId(
    zoneId: string,
  ): Promise<import('./damage-report').DamageReport[]>;
  abstract save(
    report: import('./damage-report').DamageReport,
  ): Promise<import('./damage-report').DamageReport>;
  abstract remove(id: string): Promise<void>;
}
