import {
  type DamageReportType,
  type DamageReportSeverity,
} from '../../domain/damage-report.types';

export class DamageReportCreatedEvent {
  constructor(
    readonly reportId: string,
    readonly zoneId: string,
    readonly type: DamageReportType,
    readonly severity: DamageReportSeverity,
    readonly description: string,
  ) {}
}
