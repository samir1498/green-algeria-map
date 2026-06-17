import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RegisterVolunteerCommand } from './register-volunteer.command';
import { ZoneRepository } from '../../infrastructure/zone.repository';

@CommandHandler(RegisterVolunteerCommand)
export class RegisterVolunteerHandler implements ICommandHandler<RegisterVolunteerCommand> {
  constructor(
    private readonly repository: ZoneRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(command: RegisterVolunteerCommand): Promise<void> {
    const zone = await this.repository.findById(command.zoneId);
    if (!zone) throw new NotFoundException(`Zone ${command.zoneId} not found`);

    zone.registerVolunteer();
    await this.repository.save(zone);
    await this.cache.del('zones:all');
    await this.cache.del(`zone:${command.zoneId}`);
  }
}
