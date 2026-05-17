import { Injectable, NotFoundException } from '@nestjs/common';
import { ZoneRepository } from '../domain/zone.repository';
import { Zone } from '../domain/zone';

@Injectable()
export class GetZoneByIdUseCase {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(id: string): Promise<Zone> {
    const zone = await this.repository.findById(id);
    if (!zone) throw new NotFoundException(`Zone ${id} not found`);
    return zone;
  }
}
