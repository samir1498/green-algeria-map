import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateZoneCommand } from './create-zone.command';
import { ZoneRepository } from '../../../infrastructure/zone.repository';
import { Zone } from '../../../domain/zone';
import { Coordinates } from '../../../domain/coordinates.value-object';
import { ZoneCreatedEvent } from '../../events/zone-created/zone-created.event';

@CommandHandler(CreateZoneCommand)
export class CreateZoneHandler implements ICommandHandler<
  CreateZoneCommand,
  Zone
> {
  constructor(
    private readonly repository: ZoneRepository,
    private readonly eventBus: EventBus,
  ) {}

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
    const saved = await this.repository.save(zone);
    this.eventBus.publish(
      new ZoneCreatedEvent(saved.id!, saved.name, saved.type),
    );
    return saved;
  }
}
