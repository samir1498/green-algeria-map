import { Injectable, NotFoundException } from '@nestjs/common';
import { ZoneRepository } from '../domain/zone.repository';
import { Zone } from '../domain/zone';
import { Coordinates } from '../domain/coordinates.value-object';
import { ZoneType, ZoneStatus } from '../domain/zone.types';

export interface UpdateZoneCommand {
  name?: string;
  type?: ZoneType;
  status?: ZoneStatus;
  lat?: number;
  lng?: number;
  targetCount?: number;
  currentCount?: number;
  description?: string;
}

@Injectable()
export class UpdateZoneUseCase {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(id: string, command: UpdateZoneCommand): Promise<Zone> {
    const zone = await this.repository.findById(id);
    if (!zone) throw new NotFoundException(`Zone ${id} not found`);

    if (command.name !== undefined) zone.name = command.name;
    if (command.type !== undefined) zone.type = command.type;
    if (command.status !== undefined) zone.status = command.status;
    if (command.lat !== undefined || command.lng !== undefined) {
      zone.coordinates = new Coordinates(
        command.lat ?? zone.coordinates.lat,
        command.lng ?? zone.coordinates.lng,
      );
    }
    if (command.targetCount !== undefined)
      zone.targetCount = command.targetCount;
    if (command.currentCount !== undefined)
      zone.updateProgress(command.currentCount);
    if (command.description !== undefined)
      zone.description = command.description;

    return this.repository.save(zone);
  }
}
