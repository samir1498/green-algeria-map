import { ZoneType, ZoneStatus } from '../../domain/zone.types';

export class CreateZoneCommand {
  constructor(
    readonly name: string,
    readonly type: ZoneType,
    readonly status: ZoneStatus,
    readonly lat: number,
    readonly lng: number,
    readonly targetCount?: number,
    readonly currentCount?: number,
    readonly description?: string,
  ) {}
}
