import { IsString, IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { ZONE_TYPES, ZONE_STATUSES } from '../domain/zone.types';

export class CreateZoneDto {
  @IsString()
  name: string;

  @IsIn(ZONE_TYPES)
  type: (typeof ZONE_TYPES)[number];

  @IsIn(ZONE_STATUSES)
  status: (typeof ZONE_STATUSES)[number];

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentCount?: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  organizerContact?: string;

  @IsOptional()
  @IsString()
  treeSpecies?: string;
}
