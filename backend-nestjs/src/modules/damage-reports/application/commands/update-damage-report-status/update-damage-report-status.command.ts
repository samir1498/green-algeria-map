import { Command } from '@nestjs/cqrs';
import { DamageReport } from '../../../domain/damage-report';
import { type DamageReportStatus } from '../../../domain/damage-report.types';

export class UpdateDamageReportStatusCommand extends Command<DamageReport> {
  constructor(
    readonly id: string,
    readonly status: DamageReportStatus,
  ) {
    super();
  }
}
