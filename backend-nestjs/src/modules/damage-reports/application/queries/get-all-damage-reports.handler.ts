import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetAllDamageReportsQuery } from './get-all-damage-reports.query';
import { DamageReportRepository } from '../../infrastructure/damage-report.repository';
import { DamageReport } from '../../domain/damage-report';

@QueryHandler(GetAllDamageReportsQuery)
export class GetAllDamageReportsHandler implements IQueryHandler<
  GetAllDamageReportsQuery,
  DamageReport[]
> {
  constructor(
    private readonly repository: DamageReportRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(query: GetAllDamageReportsQuery): Promise<DamageReport[]> {
    if (query.zoneId) {
      const key = `damage-reports:zone:${query.zoneId}`;
      const cached = await this.cache.get<DamageReport[]>(key);
      if (cached) return cached;
      const result = await this.repository.findByZoneId(query.zoneId);
      await this.cache.set(key, result);
      return result;
    }
    const cached = await this.cache.get<DamageReport[]>('damage-reports:all');
    if (cached) return cached;
    const result = await this.repository.findAll();
    await this.cache.set('damage-reports:all', result);
    return result;
  }
}
