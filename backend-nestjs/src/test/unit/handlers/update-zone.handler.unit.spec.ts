import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { UpdateZoneHandler } from '../../../modules/zones/application/commands/update-zone.handler';
import { UpdateZoneCommand } from '../../../modules/zones/application/commands/update-zone.command';
import { ZoneRepository } from '../../../modules/zones/domain/zone.repository';
import { Zone } from '../../../modules/zones/domain/zone';

describe('UpdateZoneHandler', () => {
  function makeRepository(): ZoneRepository {
    return {
      save: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      remove: vi.fn(),
      existsByName: vi.fn(),
    };
  }

  function makeZone(
    overrides = {} as {
      name?: string;
      type?: 'planting' | 'trash' | 'cleanup';
      status?: 'planned' | 'in-progress' | 'completed';
      lat?: number;
      lng?: number;
      targetCount?: number;
      currentCount?: number;
      description?: string;
    },
  ) {
    const zone = Zone.create({
      name: overrides.name ?? 'Original Name',
      type: overrides.type ?? 'planting',
      status: overrides.status ?? 'planned',
      coordinates: {
        lat: overrides.lat ?? 36.75,
        lng: overrides.lng ?? 3.05,
      },
      targetCount: overrides.targetCount ?? 100,
      currentCount: overrides.currentCount ?? 0,
      description: overrides.description ?? 'Original description',
    });
    (zone as any).id = 'zone-id-1';
    return zone;
  }

  it('throws NotFoundException when zone does not exist', async () => {
    const mockRepository = makeRepository();
    (mockRepository.findById as any).mockResolvedValue(null);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand('non-existent');

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('updates zone name when provided', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone();
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand('zone-id-1', 'New Name');
    await handler.execute(command);

    expect(zone.name).toBe('New Name');
    expect(mockRepository.save).toHaveBeenCalledWith(zone);
  });

  it('updates zone type when provided', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone({ type: 'planting' });
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand('zone-id-1', undefined, 'cleanup');
    await handler.execute(command);

    expect(zone.type).toBe('cleanup');
    expect(mockRepository.save).toHaveBeenCalledWith(zone);
  });

  it('updates coordinates when lat and lng provided', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone();
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand(
      'zone-id-1',
      undefined,
      undefined,
      undefined,
      35.5,
      -1.2,
    );
    await handler.execute(command);

    expect(zone.coordinates.lat).toBe(35.5);
    expect(zone.coordinates.lng).toBe(-1.2);
    expect(mockRepository.save).toHaveBeenCalledWith(zone);
  });

  it('updates only lat when lng not provided', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone();
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand(
      'zone-id-1',
      undefined,
      undefined,
      undefined,
      35.5,
    );
    await handler.execute(command);

    expect(zone.coordinates.lat).toBe(35.5);
    expect(zone.coordinates.lng).toBe(3.05);
    expect(mockRepository.save).toHaveBeenCalledWith(zone);
  });

  it('updates targetCount when provided', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone({ targetCount: 100 });
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand(
      'zone-id-1',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      200,
    );
    await handler.execute(command);

    expect(zone.targetCount).toBe(200);
    expect(mockRepository.save).toHaveBeenCalledWith(zone);
  });

  it('updates progress when currentCount provided', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone({ currentCount: 0 });
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand(
      'zone-id-1',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      50,
    );
    await handler.execute(command);

    expect(zone.currentCount).toBe(50);
    expect(mockRepository.save).toHaveBeenCalledWith(zone);
  });

  it('updates status when provided', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone({ status: 'planned' });
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand(
      'zone-id-1',
      undefined,
      undefined,
      'in-progress',
    );
    await handler.execute(command);

    expect(zone.status).toBe('in-progress');
    expect(mockRepository.save).toHaveBeenCalledWith(zone);
  });

  it('updates description when provided', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone({ description: 'Original' });
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand(
      'zone-id-1',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'Updated',
    );
    await handler.execute(command);

    expect(zone.description).toBe('Updated');
    expect(mockRepository.save).toHaveBeenCalledWith(zone);
  });

  it('skips update for undefined fields', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone({ name: 'Kept Name', targetCount: 100 });
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const command = new UpdateZoneCommand('zone-id-1');
    await handler.execute(command);

    expect(zone.name).toBe('Kept Name');
    expect(zone.targetCount).toBe(100);
    expect(mockRepository.save).toHaveBeenCalledWith(zone);
  });

  it('returns updated zone', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone();
    (mockRepository.findById as any).mockResolvedValue(zone);
    (mockRepository.save as any).mockResolvedValue(zone);
    const handler = new UpdateZoneHandler(mockRepository);

    const result = await handler.execute(
      new UpdateZoneCommand('zone-id-1', 'Updated'),
    );

    expect(result).toBe(zone);
  });
});
