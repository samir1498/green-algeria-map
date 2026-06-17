import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DeleteDamageReportCommand } from './delete-damage-report.command';
import { DamageReportRepository } from '../../infrastructure/damage-report.repository';

@CommandHandler(DeleteDamageReportCommand)
export class DeleteDamageReportHandler implements ICommandHandler<
  DeleteDamageReportCommand,
  void
> {
  constructor(
    private readonly repository: DamageReportRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(command: DeleteDamageReportCommand): Promise<void> {
    const existing = await this.repository.findById(command.id);
    if (!existing) {
      throw new NotFoundException(
        `Damage report with ID '${command.id}' not found`,
      );
    }
    await this.repository.remove(command.id);
    await this.cache.del('damage-reports:all');
    await this.cache.del(`damage-report:${command.id}`);
    if (existing.zoneId) {
      await this.cache.del(`damage-reports:zone:${existing.zoneId}`);
    }
  }
}
