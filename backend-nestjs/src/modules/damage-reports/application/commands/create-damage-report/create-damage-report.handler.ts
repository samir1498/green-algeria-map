import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateDamageReportCommand } from './create-damage-report.command';
import { DamageReportRepository } from '../../../domain/damage-report.repository';
import { DamageReport } from '../../../domain/damage-report';
import { DamageReportCreatedEvent } from '../../events/damage-report-created.event';

@CommandHandler(CreateDamageReportCommand)
export class CreateDamageReportHandler implements ICommandHandler<
  CreateDamageReportCommand,
  DamageReport
> {
  constructor(
    private readonly repository: DamageReportRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateDamageReportCommand): Promise<DamageReport> {
    const report = DamageReport.create({
      zoneId: command.zoneId,
      type: command.type,
      severity: command.severity,
      lat: command.lat,
      lng: command.lng,
      description: command.description,
      reportedBy: command.reportedBy,
    });

    const saved = await this.repository.save(report);

    this.eventBus.publish(
      new DamageReportCreatedEvent(
        saved.id,
        saved.zoneId,
        saved.type,
        saved.severity,
        saved.description,
      ),
    );

    return saved;
  }
}
