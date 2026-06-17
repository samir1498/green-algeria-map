import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetAllZonesQuery } from './get-all-zones.query';
import { ZoneRepository } from '../../infrastructure/zone.repository';
import { ZoneResponseDto } from '../../dto/zone-response.dto';

@QueryHandler(GetAllZonesQuery)
export class GetAllZonesHandler implements IQueryHandler<
  GetAllZonesQuery,
  ZoneResponseDto[]
> {
  constructor(
    private readonly repository: ZoneRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(): Promise<ZoneResponseDto[]> {
    const cached = await this.cache.get<ZoneResponseDto[]>('zones:all');
    if (cached) return cached;
    const result = await this.repository.findAll();
    await this.cache.set('zones:all', result);
    return result;
  }
}
