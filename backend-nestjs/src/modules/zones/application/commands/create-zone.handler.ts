import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateZoneCommand } from './create-zone.command';
import { ZoneRepository } from '../../domain/zone.repository';
import { Zone } from '../../domain/zone';
import { Coordinates } from '../../domain/coordinates.value-object';
import { ZoneCreatedEvent } from '../events/zone-created.event';

@CommandHandler(CreateZoneCommand)
export class CreateZoneHandler implements ICommandHandler<
  CreateZoneCommand,
  Zone
> {
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
      description: command.description ?? '',
    });
    zone.recordEvent(new ZoneCreatedEvent(zone.id!, zone.name, zone.type));
    return this.repository.save(zone);
  }
}
