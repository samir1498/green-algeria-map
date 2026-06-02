import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { AddPhotoToZoneCommand } from './add-photo-to-zone.command';
import { ZoneRepository } from '../../infrastructure/zone.repository';

@CommandHandler(AddPhotoToZoneCommand)
export class AddPhotoToZoneHandler implements ICommandHandler<AddPhotoToZoneCommand> {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(command: AddPhotoToZoneCommand): Promise<void> {
    const zone = await this.repository.findById(command.zoneId);
    if (!zone) throw new NotFoundException(`Zone ${command.zoneId} not found`);

    zone.addPhoto(command.photoUrl);
    await this.repository.save(zone);
  }
}
