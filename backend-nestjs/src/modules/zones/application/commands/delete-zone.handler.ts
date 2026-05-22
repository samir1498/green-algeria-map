import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteZoneCommand } from './delete-zone.command';
import { ZoneRepository } from '../../infrastructure/zone.repository';

@CommandHandler(DeleteZoneCommand)
export class DeleteZoneHandler implements ICommandHandler<
  DeleteZoneCommand,
  void
> {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(command: DeleteZoneCommand): Promise<void> {
    const exists = await this.repository.findById(command.id);
    if (!exists) throw new NotFoundException(`Zone ${command.id} not found`);
    await this.repository.remove(command.id);
  }
}
