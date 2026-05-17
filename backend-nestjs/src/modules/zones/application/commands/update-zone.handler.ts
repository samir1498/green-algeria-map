import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UpdateZoneCommand } from './update-zone.command';
import { ZoneRepository } from '../../domain/zone.repository';
import { Zone } from '../../domain/zone';
import { Coordinates } from '../../domain/coordinates.value-object';

@CommandHandler(UpdateZoneCommand)
export class UpdateZoneHandler implements ICommandHandler<
  UpdateZoneCommand,
  Zone
> {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(command: UpdateZoneCommand): Promise<Zone> {
    const zone = await this.repository.findById(command.id);
    if (!zone) throw new NotFoundException(`Zone ${command.id} not found`);

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
