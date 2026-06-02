import { Command } from '@nestjs/cqrs';
import { DamageReport } from '../../domain/damage-report';
import {
  type DamageReportType,
  type DamageReportSeverity,
} from '../../domain/damage-report.types';

export class CreateDamageReportCommand extends Command<DamageReport> {
  constructor(
    readonly zoneId: string,
    readonly type: DamageReportType,
    readonly severity: DamageReportSeverity,
    readonly lat: number,
    readonly lng: number,
    readonly description: string,
    readonly reportedBy: string,
  ) {
    super();
  }
}
