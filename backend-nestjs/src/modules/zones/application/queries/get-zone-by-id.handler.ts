import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetZoneByIdQuery } from './get-zone-by-id.query';
import { ZoneRepository } from '../../infrastructure/zone.repository';
import { Zone } from '../../domain/zone';

@QueryHandler(GetZoneByIdQuery)
export class GetZoneByIdHandler implements IQueryHandler<
  GetZoneByIdQuery,
  Zone
> {
  constructor(
    private readonly repository: ZoneRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(query: GetZoneByIdQuery): Promise<Zone> {
    const key = `zone:${query.id}`;
    const cached = await this.cache.get<Zone>(key);
    if (cached) return cached;
    const zone = await this.repository.findById(query.id);
    if (!zone) throw new NotFoundException(`Zone ${query.id} not found`);
    await this.cache.set(key, zone);
    return zone;
  }
}
