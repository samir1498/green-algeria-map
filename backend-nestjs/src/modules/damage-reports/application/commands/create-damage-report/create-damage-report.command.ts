import {
  type DamageReportType,
  type DamageReportSeverity,
} from '../../../domain/damage-report.types';

export class CreateDamageReportCommand {
  constructor(
    readonly zoneId: string,
    readonly type: DamageReportType,
    readonly severity: DamageReportSeverity,
    readonly lat: number,
    readonly lng: number,
    readonly description: string,
    readonly reportedBy: string,
  ) {}
}
