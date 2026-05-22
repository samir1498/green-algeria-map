import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetDamageReportByIdQuery } from './get-damage-report-by-id.query';
import { DamageReportRepository } from '../../../infrastructure/damage-report.repository';
import { DamageReport } from '../../../domain/damage-report';

@QueryHandler(GetDamageReportByIdQuery)
export class GetDamageReportByIdHandler implements IQueryHandler<
  GetDamageReportByIdQuery,
  DamageReport
> {
  constructor(private readonly repository: DamageReportRepository) {}

  async execute(query: GetDamageReportByIdQuery): Promise<DamageReport> {
    const report = await this.repository.findById(query.id);
    if (!report) {
      throw new NotFoundException(
        `Damage report with ID '${query.id}' not found`,
      );
    }
    return report;
  }
}
