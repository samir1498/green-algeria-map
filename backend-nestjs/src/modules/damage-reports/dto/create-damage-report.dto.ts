import { IsString, IsIn, IsNumber, IsPositive } from 'class-validator';
import {
  DAMAGE_REPORT_TYPES,
  DAMAGE_REPORT_SEVERITIES,
} from '../domain/damage-report.types';

export class CreateDamageReportDto {
  @IsString()
  zoneId: string;

  @IsIn(DAMAGE_REPORT_TYPES)
  type: string;

  @IsIn(DAMAGE_REPORT_SEVERITIES)
  severity: string;

  @IsNumber()
  @IsPositive()
  lat: number;

  @IsNumber()
  @IsPositive()
  lng: number;

  @IsString()
  description: string;

  @IsString()
  reportedBy: string;
}
