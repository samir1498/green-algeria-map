import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DeleteZoneCommand } from './delete-zone.command';
import { ZoneRepository } from '../../infrastructure/zone.repository';

@CommandHandler(DeleteZoneCommand)
export class DeleteZoneHandler implements ICommandHandler<
  DeleteZoneCommand,
  void
> {
  constructor(
    private readonly repository: ZoneRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(command: DeleteZoneCommand): Promise<void> {
    const exists = await this.repository.findById(command.id);
    if (!exists) throw new NotFoundException(`Zone ${command.id} not found`);
    await this.repository.remove(command.id);
    await this.cache.del('zones:all');
    await this.cache.del(`zone:${command.id}`);
  }
}
