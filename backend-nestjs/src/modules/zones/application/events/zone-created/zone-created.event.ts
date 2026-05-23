import { ZoneType } from '../../../domain/zone.types';

export class ZoneCreatedEvent {
  constructor(
    readonly zoneId: string,
    readonly name: string,
    readonly type: ZoneType,
  ) {}
}
