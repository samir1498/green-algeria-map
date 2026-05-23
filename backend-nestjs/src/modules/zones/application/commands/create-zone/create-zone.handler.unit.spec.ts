import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '@nestjs/cqrs';
import { CreateZoneHandler } from './create-zone.handler';
import { CreateZoneCommand } from './create-zone.command';
import { ZoneRepository } from '../../../infrastructure/zone.repository';
import { Zone } from '../../../domain/zone';

describe('CreateZoneHandler', () => {
  function makeRepository(): ZoneRepository {
    return {
      save: vi.fn() as any,
      findAll: vi.fn(),
      findById: vi.fn(),
      remove: vi.fn(),
      existsByName: vi.fn(),
    };
  }

  function makeEventBus(): { publish: ReturnType<typeof vi.fn> } {
    return { publish: vi.fn() };
  }

  it('calls repository.save with zone created from command', async () => {
    let capturedZone: Zone | undefined;
    const mockRepository = makeRepository();
    (mockRepository.save as any).mockImplementation((zone: Zone) => {
      (zone as any).id = 'test-uuid';
      capturedZone = zone;
      return zone;
    });
    const mockEventBus = makeEventBus();
    const handler = new CreateZoneHandler(
      mockRepository,
      mockEventBus as unknown as EventBus,
    );

    const command = new CreateZoneCommand(
      'Forest Zone A',
      'planting',
      36.75,
      3.05,
      'planned',
      100,
      0,
      'New forest zone',
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(capturedZone?.name).toBe('Forest Zone A');
    expect(capturedZone?.type).toBe('planting');
    expect(capturedZone?.targetCount).toBe(100);
  });

  it('publishes ZoneCreatedEvent after saving', async () => {
    const mockRepository = makeRepository();
    (mockRepository.save as any).mockImplementation((zone: Zone) => {
      (zone as any).id = 'test-uuid';
      return zone;
    });
    const mockEventBus = makeEventBus();
    const handler = new CreateZoneHandler(
      mockRepository,
      mockEventBus as unknown as EventBus,
    );

    const command = new CreateZoneCommand(
      'Forest Zone B',
      'planting',
      36.75,
      3.05,
      'planned',
      50,
      0,
    );

    await handler.execute(command);

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const calls = (mockEventBus.publish as any).mock.calls;
    expect(calls.length).toBe(1);
    const event = calls[0][0];
    expect(event.zoneId).toBe('test-uuid');
    expect(event.name).toBe('Forest Zone B');
    expect(event.type).toBe('planting');
  });

  it('sets description to empty string when not provided', async () => {
    let capturedZone: Zone | undefined;
    const mockRepository = makeRepository();
    (mockRepository.save as any).mockImplementation((zone: Zone) => {
      (zone as any).id = 'test-uuid';
      capturedZone = zone;
      return zone;
    });
    const mockEventBus = makeEventBus();
    const handler = new CreateZoneHandler(
      mockRepository,
      mockEventBus as unknown as EventBus,
    );

    const command = new CreateZoneCommand(
      'Zone No Desc',
      'cleanup',
      34.5,
      2.1,
      'planned',
      10,
    );

    await handler.execute(command);

    expect(capturedZone?.description).toBe('');
  });
});
