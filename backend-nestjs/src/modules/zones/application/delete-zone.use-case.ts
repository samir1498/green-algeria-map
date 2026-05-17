import { Injectable, NotFoundException } from '@nestjs/common';
import { ZoneRepository } from '../domain/zone.repository';

@Injectable()
export class DeleteZoneUseCase {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(id: string): Promise<void> {
    const zone = await this.repository.findById(id);
    if (!zone) throw new NotFoundException(`Zone ${id} not found`);
    await this.repository.remove(id);
  }
}
