import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllZonesQuery } from './get-all-zones.query';
import { ZoneRepository } from '../../../infrastructure/zone.repository';
import { Zone } from '../../../domain/zone';

@QueryHandler(GetAllZonesQuery)
export class GetAllZonesHandler implements IQueryHandler<
  GetAllZonesQuery,
  Zone[]
> {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(): Promise<Zone[]> {
    return this.repository.findAll();
  }
}
