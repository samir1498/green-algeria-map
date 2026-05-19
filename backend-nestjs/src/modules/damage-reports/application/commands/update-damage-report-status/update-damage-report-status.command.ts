import { type DamageReportStatus } from '../../../domain/damage-report.types';

export class UpdateDamageReportStatusCommand {
  constructor(
    readonly id: string,
    readonly status: DamageReportStatus,
  ) {}
}
