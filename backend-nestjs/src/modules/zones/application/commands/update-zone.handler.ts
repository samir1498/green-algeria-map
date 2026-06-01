import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UpdateZoneCommand } from './update-zone.command';
import { ZoneRepository } from '../../infrastructure/zone.repository';
import { Zone } from '../../domain/zone';

@CommandHandler(UpdateZoneCommand)
export class UpdateZoneHandler implements ICommandHandler<
  UpdateZoneCommand,
  Zone
> {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(command: UpdateZoneCommand): Promise<Zone> {
    const zone = await this.repository.findById(command.id);
    if (!zone) throw new NotFoundException(`Zone ${command.id} not found`);

    if (command.name !== undefined) zone.rename(command.name);
    if (command.type !== undefined) zone.updateType(command.type);
    if (command.lat !== undefined || command.lng !== undefined) {
      zone.reposition(
        command.lat ?? zone.coordinates.lat,
        command.lng ?? zone.coordinates.lng,
      );
    }
    if (command.targetCount !== undefined)
      zone.updateTargetCount(command.targetCount);
    if (command.currentCount !== undefined)
      zone.updateProgress(command.currentCount);
    if (command.status !== undefined) zone.changeStatus(command.status);
    if (command.description !== undefined)
      zone.updateDescription(command.description);
    if (command.organizerContact !== undefined)
      zone.updateOrganizerContact(command.organizerContact);
    if (command.treeSpecies !== undefined)
      zone.updateTreeSpecies(command.treeSpecies);

    return this.repository.save(zone);
  }
}
