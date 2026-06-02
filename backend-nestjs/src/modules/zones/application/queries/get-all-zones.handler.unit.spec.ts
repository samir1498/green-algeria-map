import { describe, it, expect, vi } from 'vitest';
import { GetAllZonesHandler } from './get-all-zones.handler';
import { GetAllZonesQuery } from './get-all-zones.query';
import { Zone } from '../../domain/zone';

describe('GetAllZonesHandler', () => {
  function makeZone(name: string) {
    const zone = Zone.create({
      name,
      type: 'planting',
      status: 'planned',
      coordinates: { lat: 36.75, lng: 3.05 },
      targetCount: 10,
      description: 'A zone',
    });
    (zone as any).id = `id-${name}`;
    return zone;
  }

  it('returns empty array when no zones exist', async () => {
    const mockFindAll = vi.fn().mockResolvedValue([]);
    const mockRepository = {
      save: vi.fn(),
      findAll: mockFindAll,
      findById: vi.fn(),
      remove: vi.fn(),
      existsByName: vi.fn(),
    };
    const handler: any = new GetAllZonesHandler(mockRepository);
    const query = new GetAllZonesQuery();

    const result = await (handler.execute as (q: any) => Promise<Zone[]>)(
      query,
    );

    expect(result).toEqual([]);
    expect(mockFindAll).toHaveBeenCalled();
  });

  it('returns all zones from repository', async () => {
    const zones = [makeZone('Zone A'), makeZone('Zone B')];
    const mockFindAll = vi.fn().mockResolvedValue(zones);
    const mockRepository = {
      save: vi.fn(),
      findAll: mockFindAll,
      findById: vi.fn(),
      remove: vi.fn(),
      existsByName: vi.fn(),
    };
    const handler: any = new GetAllZonesHandler(mockRepository);
    const query = new GetAllZonesQuery();

    const result = await (handler.execute as (q: any) => Promise<Zone[]>)(
      query,
    );

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Zone A');
    expect(result[1].name).toBe('Zone B');
  });
});
