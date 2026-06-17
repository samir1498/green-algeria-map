import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UpdateDamageReportStatusCommand } from './update-damage-report-status.command';
import { DamageReportRepository } from '../../infrastructure/damage-report.repository';
import { DamageReport } from '../../domain/damage-report';

@CommandHandler(UpdateDamageReportStatusCommand)
export class UpdateDamageReportStatusHandler implements ICommandHandler<
  UpdateDamageReportStatusCommand,
  DamageReport
> {
  constructor(
    private readonly repository: DamageReportRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(
    command: UpdateDamageReportStatusCommand,
  ): Promise<DamageReport> {
    const existing = await this.repository.findById(command.id);
    if (!existing) {
      throw new NotFoundException(
        `Damage report with ID '${command.id}' not found`,
      );
    }

    const updated = existing.changeStatus(command.status);
    const saved = await this.repository.save(updated);
    await this.cache.del('damage-reports:all');
    await this.cache.del(`damage-report:${command.id}`);
    if (saved.zoneId) {
      await this.cache.del(`damage-reports:zone:${saved.zoneId}`);
    }
    return saved;
  }
}
