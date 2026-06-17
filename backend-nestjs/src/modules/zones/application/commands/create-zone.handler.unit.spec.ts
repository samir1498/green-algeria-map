import { describe, expect, it, vi } from 'vitest';
import { CreateZoneHandler } from './create-zone.handler';
import { CreateZoneCommand } from './create-zone.command';
import { Zone } from '../../domain/zone';
import { Coordinates } from '../../domain/coordinates.value-object';
import { ZoneCreatedEvent } from '../events/zone-created.event';

const mockRepository = { save: vi.fn() };
const mockEventBus = { publish: vi.fn() };
const mockCache = { get: vi.fn(), set: vi.fn(), del: vi.fn() };
const handler = new CreateZoneHandler(
  mockRepository as any,
  mockEventBus as any,
  mockCache as any,
);

beforeEach(() => vi.resetAllMocks());

describe('CreateZoneHandler', () => {
  const command = new CreateZoneCommand(
    'Park',
    'planting',
    36.75,
    3.05,
    'planned',
    100,
    0,
    'desc',
    'c@e.com',
    'cedar',
  );

  it('creates zone and publishes event', async () => {
    mockRepository.save.mockResolvedValue(
      Object.assign(
        Zone.create({
          name: 'Park',
          type: 'planting',
          status: 'planned',
          coordinates: new Coordinates(36.75, 3.05),
          description: '',
        }),
        { id: 'z-1' },
      ),
    );

    const result = await handler.execute(command);

    expect(result).toMatchObject({ id: 'z-1', name: 'Park' });
    expect(mockCache.del).toHaveBeenCalledWith('zones:all');

    const saved = mockRepository.save.mock.calls[0][0] as Zone;
    expect(saved).toMatchObject({
      name: 'Park',
      type: 'planting',
      targetCount: 100,
      organizerContact: 'c@e.com',
    });
    expect(saved.coordinates).toMatchObject({ lat: 36.75, lng: 3.05 });

    const event = mockEventBus.publish.mock.calls[0][0];
    expect(event).toBeInstanceOf(ZoneCreatedEvent);
    expect(event.zoneId).toBe('z-1');
    expect(event.name).toBe('Park');
  });
});
