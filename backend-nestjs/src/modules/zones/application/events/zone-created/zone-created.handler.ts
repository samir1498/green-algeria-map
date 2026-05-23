import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ZoneCreatedEvent } from './zone-created.event';

@EventsHandler(ZoneCreatedEvent)
export class ZoneCreatedHandler implements IEventHandler<ZoneCreatedEvent> {
  private readonly logger = new Logger(ZoneCreatedHandler.name);

  handle(event: ZoneCreatedEvent): void {
    this.logger.log(
      `Zone "${event.name}" (${event.type}) created with ID ${event.zoneId}`,
    );
  }
}
