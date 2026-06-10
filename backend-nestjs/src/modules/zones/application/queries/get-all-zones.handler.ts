import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllZonesQuery } from './get-all-zones.query';
import { ZoneRepository } from '../../infrastructure/zone.repository';
import { ZoneResponseDto } from '../../dto/zone-response.dto';

@QueryHandler(GetAllZonesQuery)
export class GetAllZonesHandler implements IQueryHandler<
  GetAllZonesQuery,
  ZoneResponseDto[]
> {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(): Promise<ZoneResponseDto[]> {
    return this.repository.findAll();
  }
}
