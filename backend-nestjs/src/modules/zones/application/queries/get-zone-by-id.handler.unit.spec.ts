import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { GetZoneByIdHandler } from './get-zone-by-id.handler';
import { GetZoneByIdQuery } from './get-zone-by-id.query';
import { ZoneRepository } from '../../infrastructure/zone.repository';
import { Zone } from '../../domain/zone';

describe('GetZoneByIdHandler', () => {
  function makeRepository(): ZoneRepository {
    return {
      save: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      remove: vi.fn(),
    };
  }

  function makeZone(name: string) {
    const zone = Zone.create({
      name,
      type: 'planting',
      status: 'planned',
      coordinates: { lat: 36.75, lng: 3.05 },
      targetCount: 10,
      description: 'A zone',
    });
    (zone as any).id = 'zone-123';
    return zone;
  }

  it('throws NotFoundException when zone not found', async () => {
    const mockRepository = makeRepository();
    (mockRepository.findById as any).mockResolvedValue(null);
    const handler: any = new GetZoneByIdHandler(mockRepository);

    const query = new GetZoneByIdQuery('non-existent-id');

    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
  });

  it('returns zone when found', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone('Found Zone');
    (mockRepository.findById as any).mockResolvedValue(zone);
    const handler: any = new GetZoneByIdHandler(mockRepository);

    const query = new GetZoneByIdQuery('zone-123');

    const result = await handler.execute(query);

    expect(result).toBe(zone);
    expect(result.name).toBe('Found Zone');
  });
});
