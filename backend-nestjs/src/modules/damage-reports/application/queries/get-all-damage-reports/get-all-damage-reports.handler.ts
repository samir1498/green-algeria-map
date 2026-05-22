import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllDamageReportsQuery } from './get-all-damage-reports.query';
import { DamageReportRepository } from '../../../infrastructure/damage-report.repository';
import { DamageReport } from '../../../domain/damage-report';

@QueryHandler(GetAllDamageReportsQuery)
export class GetAllDamageReportsHandler implements IQueryHandler<
  GetAllDamageReportsQuery,
  DamageReport[]
> {
  constructor(private readonly repository: DamageReportRepository) {}

  async execute(query: GetAllDamageReportsQuery): Promise<DamageReport[]> {
    if (query.zoneId) {
      return this.repository.findByZoneId(query.zoneId);
    }
    return this.repository.findAll();
  }
}
