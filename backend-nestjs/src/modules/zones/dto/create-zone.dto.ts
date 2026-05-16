import { IsString, IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  name: string;

  @IsIn(['planting', 'trash', 'cleanup'])
  type: 'planting' | 'trash' | 'cleanup';

  @IsIn(['planned', 'in-progress', 'completed'])
  status: 'planned' | 'in-progress' | 'completed';

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
}
