import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './zone.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly repo: Repository<Zone>,
  ) {}

  findAll(): Promise<Zone[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Zone> {
    const zone = await this.repo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException(`Zone ${id} not found`);
    return zone;
  }

  create(dto: CreateZoneDto): Promise<Zone> {
    const zone = this.repo.create(dto);
    return this.repo.save(zone);
  }

  async update(id: string, dto: UpdateZoneDto): Promise<Zone> {
    const zone = await this.findOne(id);
    Object.assign(zone, dto);
    return this.repo.save(zone);
  }

  async remove(id: string): Promise<void> {
    const zone = await this.findOne(id);
    await this.repo.remove(zone);
  }
}
