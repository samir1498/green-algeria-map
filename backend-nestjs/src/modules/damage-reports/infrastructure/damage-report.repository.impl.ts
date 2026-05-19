import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DamageReportRepository } from '../domain/damage-report.repository';
import { DamageReport } from '../domain/damage-report';
import { DamageReportOrmEntity } from './damage-report.orm-entity';
import { DamageReportMapper } from './damage-report.mapper';

@Injectable()
export class DamageReportRepositoryImpl implements DamageReportRepository {
  constructor(
    @InjectRepository(DamageReportOrmEntity)
    private readonly repo: Repository<DamageReportOrmEntity>,
  ) {}

  async findAll(): Promise<DamageReport[]> {
    const entities = await this.repo.find({ order: { reportedAt: 'DESC' } });
    return entities.map((e) => DamageReportMapper.toDomain(e));
  }

  async findById(id: string): Promise<DamageReport | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? DamageReportMapper.toDomain(entity) : null;
  }

  async findByZoneId(zoneId: string): Promise<DamageReport[]> {
    const entities = await this.repo.find({
      where: { zoneId },
      order: { reportedAt: 'DESC' },
    });
    return entities.map((e) => DamageReportMapper.toDomain(e));
  }

  async save(report: DamageReport): Promise<DamageReport> {
    const entity = DamageReportMapper.toOrmEntity(report);
    const saved = await this.repo.save(entity);
    return DamageReportMapper.toDomain(saved);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
