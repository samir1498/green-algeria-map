import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from '../domain/zone';
import { ZoneOrmEntity } from './zone.orm-entity';
import { ZoneMapper } from './zone.mapper';

@Injectable()
export class ZoneRepository {
  constructor(
    @InjectRepository(ZoneOrmEntity)
    private readonly repo: Repository<ZoneOrmEntity>,
  ) {}

  async findAll(): Promise<Zone[]> {
    const entities = await this.repo.find({
      select: ['id', 'name', 'type', 'status', 'lat', 'lng', 'targetCount', 'currentCount', 'volunteerCount'],
      order: { name: 'ASC' },
    });
    return entities.map((e) => ZoneMapper.toDomain(e));
  }

  async findById(id: string): Promise<Zone | null> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return null;
    return ZoneMapper.toDomain(entity);
  }

  async save(zone: Zone): Promise<Zone> {
    const entity = ZoneMapper.toOrmEntity(zone);
    const saved = await this.repo.save(entity);
    return ZoneMapper.toDomain(saved);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
