import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ZoneCreatedEvent } from './zone-created.event';

@EventsHandler(ZoneCreatedEvent)
export class ZoneCreatedHandler implements IEventHandler<ZoneCreatedEvent> {
  handle(event: ZoneCreatedEvent): void {
    console.log(
      `[ZoneCreated] Zone "${event.name}" (${event.type}) created with ID ${event.zoneId}`,
    );
  }
}
