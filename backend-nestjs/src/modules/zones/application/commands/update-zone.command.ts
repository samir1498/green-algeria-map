import { Command } from '@nestjs/cqrs';
import { Zone } from '../../domain/zone';
import { ZoneType, ZoneStatus } from '../../domain/zone.types';

export class UpdateZoneCommand extends Command<Zone> {
  constructor(
    readonly id: string,
    readonly name?: string,
    readonly type?: ZoneType,
    readonly status?: ZoneStatus,
    readonly lat?: number,
    readonly lng?: number,
    readonly targetCount?: number,
    readonly currentCount?: number,
    readonly description?: string,
    readonly organizerContact?: string,
    readonly treeSpecies?: string,
  ) {
    super();
  }
}
