import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteDamageReportCommand } from './delete-damage-report.command';
import { DamageReportRepository } from '../../infrastructure/damage-report.repository';

@CommandHandler(DeleteDamageReportCommand)
export class DeleteDamageReportHandler implements ICommandHandler<
  DeleteDamageReportCommand,
  void
> {
  constructor(private readonly repository: DamageReportRepository) {}

  async execute(command: DeleteDamageReportCommand): Promise<void> {
    const existing = await this.repository.findById(command.id);
    if (!existing) {
      throw new NotFoundException(
        `Damage report with ID '${command.id}' not found`,
      );
    }
    await this.repository.remove(command.id);
  }
}
