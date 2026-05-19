import { IsIn } from 'class-validator';
import { DAMAGE_REPORT_STATUSES } from '../domain/damage-report.types';

export class UpdateDamageReportStatusDto {
  @IsIn(DAMAGE_REPORT_STATUSES)
  status: string;
}
