import { Injectable } from '@nestjs/common';
import { ZoneRepository } from '../domain/zone.repository';
import { Zone } from '../domain/zone';

@Injectable()
export class GetAllZonesUseCase {
  constructor(private readonly repository: ZoneRepository) {}

  async execute(): Promise<Zone[]> {
    return this.repository.findAll();
  }
}
