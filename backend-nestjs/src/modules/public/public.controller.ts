import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/infrastructure/public.decorator';
import { GetAllZonesQuery } from '../zones/application/queries/get-all-zones.query';
import { GetAllDamageReportsQuery } from '../damage-reports/application/queries/get-all-damage-reports.query';
import { ZoneResponseDto } from '../zones/dto/zone-response.dto';
import { DamageReportResponseDto } from '../damage-reports/dto/damage-report-response.dto';

@ApiTags('Public')
@Controller('public')
@Public()
export class PublicController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('map')
  async getMapData() {
    const [zones, damageReports] = await Promise.all([
      this.queryBus.execute(new GetAllZonesQuery()),
      this.queryBus.execute(new GetAllDamageReportsQuery()),
    ]);

    return {
      zones: zones.map((z) => ZoneResponseDto.fromDomain(z)),
      damageReports: damageReports.map((d) =>
        DamageReportResponseDto.fromDomain(d),
      ),
    };
  }
}
