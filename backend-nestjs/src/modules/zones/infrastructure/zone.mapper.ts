import { Zone } from '../domain/zone';
import { Coordinates } from '../domain/coordinates.value-object';
import { ZoneOrmEntity } from './zone.orm-entity';
import type { ZoneType, ZoneStatus } from '../domain/zone.types';

export class ZoneMapper {
  static toDomain(orm: ZoneOrmEntity): Zone {
    return Zone.create({
      id: orm.id,
      name: orm.name,
      type: orm.type as ZoneType,
      status: orm.status as ZoneStatus,
      coordinates: new Coordinates(orm.lat, orm.lng),
      targetCount: orm.targetCount,
      currentCount: orm.currentCount,
      description: orm.description,
      photos: orm.photos,
      organizerContact: orm.organizerContact,
      treeSpecies: orm.treeSpecies,
      volunteerCount: orm.volunteerCount,
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
    orm.photos = domain.photos;
    orm.organizerContact = domain.organizerContact;
    orm.treeSpecies = domain.treeSpecies;
    orm.volunteerCount = domain.volunteerCount;
    return orm;
  }
}
