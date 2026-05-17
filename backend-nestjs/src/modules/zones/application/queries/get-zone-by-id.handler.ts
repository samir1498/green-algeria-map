import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetZoneByIdQuery } from './get-zone-by-id.query';
import { ZoneRepository } from '../../domain/zone.repository';
import { Zone } from '../../domain/zone';

@QueryHandler(GetZoneByIdQuery)
export class GetZoneByIdHandler implements IQueryHandler<
  GetZoneByIdQuery,
  Zone
> {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(query: GetZoneByIdQuery): Promise<Zone> {
    const zone = await this.repository.findById(query.id);
    if (!zone) throw new NotFoundException(`Zone ${query.id} not found`);
    return zone;
  }
}
