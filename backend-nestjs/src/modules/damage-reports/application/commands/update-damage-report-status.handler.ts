import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UpdateDamageReportStatusCommand } from './update-damage-report-status.command';
import { DamageReportRepository } from '../../infrastructure/damage-report.repository';
import { DamageReport } from '../../domain/damage-report';

@CommandHandler(UpdateDamageReportStatusCommand)
export class UpdateDamageReportStatusHandler implements ICommandHandler<
  UpdateDamageReportStatusCommand,
  DamageReport
> {
  constructor(private readonly repository: DamageReportRepository) {}

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
    return this.repository.save(updated);
  }
}
