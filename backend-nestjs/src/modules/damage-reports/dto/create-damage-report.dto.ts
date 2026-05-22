import { IsString, IsIn, IsNumber, Min, Max } from 'class-validator';
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
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsString()
  description: string;

  @IsString()
  reportedBy: string;
}
