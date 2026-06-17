import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetDamageReportByIdQuery } from './get-damage-report-by-id.query';
import { DamageReportRepository } from '../../infrastructure/damage-report.repository';
import { DamageReport } from '../../domain/damage-report';

@QueryHandler(GetDamageReportByIdQuery)
export class GetDamageReportByIdHandler implements IQueryHandler<
  GetDamageReportByIdQuery,
  DamageReport
> {
  constructor(
    private readonly repository: DamageReportRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(query: GetDamageReportByIdQuery): Promise<DamageReport> {
    const key = `damage-report:${query.id}`;
    const cached = await this.cache.get<DamageReport>(key);
    if (cached) return cached;
    const report = await this.repository.findById(query.id);
    if (!report) {
      throw new NotFoundException(
        `Damage report with ID '${query.id}' not found`,
      );
    }
    await this.cache.set(key, report);
    return report;
  }
}
