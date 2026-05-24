import { Zone } from '../domain/zone';

export class ZoneResponseDto {
  id?: string;
  name: string;
  type: string;
  status: string;
  lat: number;
  lng: number;
  targetCount?: number;
  currentCount: number;
  description: string;
  photos?: string[];

  static fromDomain(zone: Zone): ZoneResponseDto {
    const dto = new ZoneResponseDto();
    dto.id = zone.id;
    dto.name = zone.name;
    dto.type = zone.type;
    dto.status = zone.status;
    dto.lat = zone.coordinates.lat;
    dto.lng = zone.coordinates.lng;
    dto.targetCount = zone.targetCount;
    dto.currentCount = zone.currentCount;
    dto.description = zone.description;
    dto.photos = zone.photos;
    return dto;
  }
}
