import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { RegisterVolunteerCommand } from './register-volunteer.command';
import { ZoneRepository } from '../../infrastructure/zone.repository';

@CommandHandler(RegisterVolunteerCommand)
export class RegisterVolunteerHandler implements ICommandHandler<RegisterVolunteerCommand> {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(command: RegisterVolunteerCommand): Promise<void> {
    const zone = await this.repository.findById(command.zoneId);
    if (!zone) throw new NotFoundException(`Zone ${command.zoneId} not found`);

    zone.registerVolunteer();
    await this.repository.save(zone);
  }
}
