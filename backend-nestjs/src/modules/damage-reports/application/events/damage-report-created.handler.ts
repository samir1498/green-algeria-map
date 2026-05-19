import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DamageReportCreatedEvent } from './damage-report-created.event';

@EventsHandler(DamageReportCreatedEvent)
export class DamageReportCreatedHandler implements IEventHandler<DamageReportCreatedEvent> {
  private readonly logger = new Logger(DamageReportCreatedHandler.name);

  handle(event: DamageReportCreatedEvent): void {
    this.logger.log(
      `[DamageReportCreatedEvent] Report ${event.reportId} created for zone ${event.zoneId}`,
    );
  }
}
