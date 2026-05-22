import { Zone } from '../domain/zone';
import { Coordinates } from '../domain/coordinates.value-object';
import { ZoneOrmEntity } from './zone.orm-entity';
import {
  ZONE_TYPES,
  ZONE_STATUSES,
  type ZoneType,
  type ZoneStatus,
} from '../domain/zone.types';
import {
  InvalidZoneTypeError,
  InvalidZoneStatusError,
} from '../domain/zone-errors';

export class ZoneMapper {
  static toDomain(orm: ZoneOrmEntity): Zone {
    if (!ZONE_TYPES.includes(orm.type as ZoneType)) {
      throw new InvalidZoneTypeError(orm.type);
    }
    if (!ZONE_STATUSES.includes(orm.status as ZoneStatus)) {
      throw new InvalidZoneStatusError(orm.status);
    }
    return Zone.create({
      id: orm.id,
      name: orm.name,
      type: orm.type as ZoneType,
      status: orm.status as ZoneStatus,
      coordinates: new Coordinates(orm.lat, orm.lng),
      targetCount: orm.targetCount,
      currentCount: orm.currentCount,
      description: orm.description,
    });
  }

  static toOrmEntity(domain: Zone): ZoneOrmEntity {
    const orm = new ZoneOrmEntity();
    if (domain.id) orm.id = domain.id;
    orm.name = domain.name;
    orm.type = domain.type;
    orm.status = domain.status;
    orm.lat = domain.coordinates.lat;
    orm.lng = domain.coordinates.lng;
    orm.targetCount = domain.targetCount;
    orm.currentCount = domain.currentCount;
    orm.description = domain.description;
    return orm;
  }
}
