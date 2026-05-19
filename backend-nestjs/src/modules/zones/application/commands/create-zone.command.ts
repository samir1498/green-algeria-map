import { ZoneType, ZoneStatus } from '../../domain/zone.types';

export class CreateZoneCommand {
  constructor(
    readonly name: string,
    readonly type: ZoneType,
    readonly lat: number,
    readonly lng: number,
    readonly status: ZoneStatus = 'planned',
    readonly targetCount?: number,
    readonly currentCount?: number,
    readonly description?: string,
  ) {}
}
