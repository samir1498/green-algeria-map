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
import { Public } from '../auth/infrastructure/public.decorator';
import { CreateDamageReportCommand } from './application/commands/create-damage-report.command';
import { UpdateDamageReportStatusCommand } from './application/commands/update-damage-report-status.command';
import { DeleteDamageReportCommand } from './application/commands/delete-damage-report.command';
import { GetAllDamageReportsQuery } from './application/queries/get-all-damage-reports.query';
import { GetDamageReportByIdQuery } from './application/queries/get-damage-report-by-id.query';
import { CreateDamageReportDto } from './dto/create-damage-report.dto';
import { UpdateDamageReportStatusDto } from './dto/update-damage-report-status.dto';
import { DamageReportResponseDto } from './dto/damage-report-response.dto';
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
  @Public()
  async findAll(@Query('zoneId') zoneId?: string) {
    const reports = await this.queryBus.execute(
      new GetAllDamageReportsQuery(zoneId),
    );
    return reports.map((r) => DamageReportResponseDto.fromDomain(r));
  }

  @Get(':id')
  @Public()
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    const report = await this.queryBus.execute(
      new GetDamageReportByIdQuery(id),
    );
    return DamageReportResponseDto.fromDomain(report);
  }

  @Post()
  @Public()
  async create(@Body() dto: CreateDamageReportDto) {
    const report = await this.commandBus.execute(
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
    return DamageReportResponseDto.fromDomain(report);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDamageReportStatusDto,
  ) {
    const report = await this.commandBus.execute(
      new UpdateDamageReportStatusCommand(
        id,
        dto.status as (typeof DAMAGE_REPORT_STATUSES)[number],
      ),
    );
    return DamageReportResponseDto.fromDomain(report);
  }

  @Delete(':id')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.commandBus.execute(new DeleteDamageReportCommand(id));
  }
}
