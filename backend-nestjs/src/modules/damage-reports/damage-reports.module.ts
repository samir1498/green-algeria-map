import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DamageReportsController } from './damage-reports.controller';
import { DamageReportRepository } from './domain/damage-report.repository';
import { DamageReportRepositoryImpl } from './infrastructure/damage-report.repository.impl';
import { DamageReportOrmEntity } from './infrastructure/damage-report.orm-entity';
import { CreateDamageReportHandler } from './application/commands/create-damage-report/create-damage-report.handler';
import { UpdateDamageReportStatusHandler } from './application/commands/update-damage-report-status/update-damage-report-status.handler';
import { DeleteDamageReportHandler } from './application/commands/delete-damage-report/delete-damage-report.handler';
import { GetAllDamageReportsHandler } from './application/queries/get-all-damage-reports/get-all-damage-reports.handler';
import { GetDamageReportByIdHandler } from './application/queries/get-damage-report-by-id/get-damage-report-by-id.handler';
import { DamageReportCreatedHandler } from './application/events/damage-report-created.handler';

@Module({
  imports: [TypeOrmModule.forFeature([DamageReportOrmEntity]), CqrsModule],
  controllers: [DamageReportsController],
  providers: [
    { provide: DamageReportRepository, useClass: DamageReportRepositoryImpl },
    CreateDamageReportHandler,
    UpdateDamageReportStatusHandler,
    DeleteDamageReportHandler,
    GetAllDamageReportsHandler,
    GetDamageReportByIdHandler,
    DamageReportCreatedHandler,
  ],
})
export class DamageReportsModule {}
