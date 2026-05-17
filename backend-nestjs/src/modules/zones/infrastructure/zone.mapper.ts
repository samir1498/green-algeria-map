import { Zone } from '../domain/zone';
import { Coordinates } from '../domain/coordinates.value-object';
import { ZoneOrmEntity } from './zone.orm-entity';

export class ZoneMapper {
  static toDomain(orm: ZoneOrmEntity): Zone {
    return Zone.create({
      id: orm.id,
      name: orm.name,
      type: orm.type as Zone['type'],
      status: orm.status as Zone['status'],
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
