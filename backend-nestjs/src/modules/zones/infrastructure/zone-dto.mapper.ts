import { ZoneOrmEntity } from './zone.orm-entity';
import { ZoneResponseDto } from '../dto/zone-response.dto';

export class ZoneDtoMapper {
  static toDto(orm: ZoneOrmEntity): ZoneResponseDto {
    const dto = new ZoneResponseDto();
    dto.id = orm.id;
    dto.name = orm.name;
    dto.type = orm.type;
    dto.status = orm.status;
    dto.lat = orm.lat;
    dto.lng = orm.lng;
    dto.targetCount = orm.targetCount;
    dto.currentCount = orm.currentCount!;
    dto.description = orm.description;
    dto.photos = orm.photos;
    dto.organizerContact = orm.organizerContact;
    dto.treeSpecies = orm.treeSpecies;
    dto.volunteerCount = orm.volunteerCount;
    return dto;
  }
}