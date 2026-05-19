import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DamageReportCreatedEvent } from './damage-report-created.event';

@EventsHandler(DamageReportCreatedEvent)
export class DamageReportCreatedHandler implements IEventHandler<DamageReportCreatedEvent> {
  handle(event: DamageReportCreatedEvent): void {
    console.log(
      `[DamageReportCreatedEvent] Report ${event.reportId} created for zone ${event.zoneId}`,
    );
  }
}
