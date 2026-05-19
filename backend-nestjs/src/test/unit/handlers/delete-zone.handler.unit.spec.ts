import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { DeleteZoneHandler } from '../../../modules/zones/application/commands/delete-zone.handler';
import { DeleteZoneCommand } from '../../../modules/zones/application/commands/delete-zone.command';
import { ZoneRepository } from '../../../modules/zones/domain/zone.repository';
import { Zone } from '../../../modules/zones/domain/zone';

describe('DeleteZoneHandler', () => {
  function makeRepository(): ZoneRepository {
    return {
      save: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      remove: vi.fn(),
      existsByName: vi.fn(),
    };
  }

  function makeZone(name = 'Zone to Delete') {
    const zone = Zone.create({
      name,
      type: 'planting',
      status: 'planned',
      coordinates: { lat: 36.75, lng: 3.05 },
      targetCount: 10,
      description: 'A zone',
    });
    (zone as any).id = 'zone-id';
    return zone;
  }

  it('throws NotFoundException when zone does not exist', async () => {
    const mockRepository = makeRepository();
    (mockRepository.findById as any).mockResolvedValue(null);
    const handler = new DeleteZoneHandler(mockRepository);

    const command = new DeleteZoneCommand('non-existent-id');

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(mockRepository.remove).not.toHaveBeenCalled();
  });

  it('calls repository.remove with correct id when zone exists', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone();
    (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      zone,
    );
    (mockRepository.remove as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    const handler = new DeleteZoneHandler(mockRepository);

    const command = new DeleteZoneCommand('zone-id');
    await handler.execute(command);

    expect(mockRepository.findById).toHaveBeenCalledWith('zone-id');
    expect(mockRepository.remove).toHaveBeenCalledWith('zone-id');
  });

  it('returns void on successful deletion', async () => {
    const mockRepository = makeRepository();
    const zone = makeZone();
    (mockRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      zone,
    );
    (mockRepository.remove as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    const handler = new DeleteZoneHandler(mockRepository);

    const result = await handler.execute(new DeleteZoneCommand('zone-id'));

    expect(result).toBeUndefined();
  });
});
