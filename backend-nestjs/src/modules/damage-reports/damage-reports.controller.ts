import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CreateDamageReportCommand } from './application/commands/create-damage-report/create-damage-report.command';
import { UpdateDamageReportStatusCommand } from './application/commands/update-damage-report-status/update-damage-report-status.command';
import { DeleteDamageReportCommand } from './application/commands/delete-damage-report/delete-damage-report.command';
import { GetAllDamageReportsQuery } from './application/queries/get-all-damage-reports/get-all-damage-reports.query';
import { GetDamageReportByIdQuery } from './application/queries/get-damage-report-by-id/get-damage-report-by-id.query';
import { CreateDamageReportDto } from './dto/create-damage-report.dto';
import { UpdateDamageReportStatusDto } from './dto/update-damage-report-status.dto';
import {
  DAMAGE_REPORT_TYPES,
  DAMAGE_REPORT_SEVERITIES,
  DAMAGE_REPORT_STATUSES,
} from './domain/damage-report.types';

@ApiTags('Damage Reports')
@Controller('damage-reports')
export class DamageReportsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  findAll(@Query('zoneId') zoneId?: string) {
    return this.queryBus.execute(new GetAllDamageReportsQuery(zoneId));
  }

  @Get(':id')
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.queryBus.execute(new GetDamageReportByIdQuery(id));
  }

  @Post()
  create(@Body() dto: CreateDamageReportDto) {
    return this.commandBus.execute(
      new CreateDamageReportCommand(
        dto.zoneId,
        dto.type as (typeof DAMAGE_REPORT_TYPES)[number],
        dto.severity as (typeof DAMAGE_REPORT_SEVERITIES)[number],
        dto.lat,
        dto.lng,
        dto.description,
        dto.reportedBy,
      ),
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDamageReportStatusDto,
  ) {
    return this.commandBus.execute(
      new UpdateDamageReportStatusCommand(
        id,
        dto.status as (typeof DAMAGE_REPORT_STATUSES)[number],
      ),
    );
  }

  @Delete(':id')
  delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.commandBus.execute(new DeleteDamageReportCommand(id));
  }
}
