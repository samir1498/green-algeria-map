import { Injectable } from '@nestjs/common';
import { ZoneRepository } from '../domain/zone.repository';
import { Zone } from '../domain/zone';
import { Coordinates } from '../domain/coordinates.value-object';
import { ZoneType, ZoneStatus } from '../domain/zone.types';

export interface CreateZoneCommand {
  name: string;
  type: ZoneType;
  status: ZoneStatus;
  lat: number;
  lng: number;
  targetCount?: number;
  currentCount?: number;
  description: string;
}

@Injectable()
export class CreateZoneUseCase {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(command: CreateZoneCommand): Promise<Zone> {
    const coordinates = new Coordinates(command.lat, command.lng);
    const zone = Zone.create({
      name: command.name,
      type: command.type,
      status: command.status,
      coordinates,
      targetCount: command.targetCount,
      currentCount: command.currentCount,
      description: command.description,
    });
    return this.repository.save(zone);
  }
}
