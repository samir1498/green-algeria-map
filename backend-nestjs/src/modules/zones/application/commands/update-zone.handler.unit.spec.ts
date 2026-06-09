import { describe, expect, it, vi } from 'vitest';
import { UpdateZoneHandler } from './update-zone.handler';
import { UpdateZoneCommand } from './update-zone.command';
import { DeleteZoneHandler } from './delete-zone.handler';
import { NotFoundException } from '@nestjs/common';

const mockFindById = vi.fn();
const mockSave = vi.fn();
const mockRemove = vi.fn();
const mockRepo = {
  findAll: vi.fn(),
  findById: mockFindById,
  save: mockSave,
  remove: mockRemove,
};

const updateHandler = new UpdateZoneHandler(mockRepo as any);
const deleteHandler = new DeleteZoneHandler(mockRepo as any);

beforeEach(() => vi.resetAllMocks());

describe('UpdateZoneHandler', () => {
  it('updates all fields and saves', async () => {
    const zone = {
      id: 'z-1',
      name: 'Old',
      rename: vi.fn(),
      updateType: vi.fn(),
      reposition: vi.fn(),
      updateTargetCount: vi.fn(),
      updateProgress: vi.fn(),
      changeStatus: vi.fn(),
      updateDescription: vi.fn(),
      updateOrganizerContact: vi.fn(),
      updateTreeSpecies: vi.fn(),
      coordinates: { lat: 1, lng: 2 },
    };
    mockFindById.mockResolvedValue(zone);
    mockSave.mockResolvedValue(zone);

    const cmd = new UpdateZoneCommand(
      'z-1',
      'New',
      'trash',
      'in-progress',
      10,
      20,
      50,
      25,
      'desc',
      'c@e.com',
      'pine',
    );
    await updateHandler.execute(cmd);

    expect(zone.rename).toHaveBeenCalledWith('New');
    expect(zone.updateType).toHaveBeenCalledWith('trash');
    expect(zone.reposition).toHaveBeenCalledWith(10, 20);
    expect(zone.updateTargetCount).toHaveBeenCalledWith(50);
    expect(zone.updateProgress).toHaveBeenCalledWith(25);
    expect(zone.changeStatus).toHaveBeenCalledWith('in-progress');
    expect(zone.updateDescription).toHaveBeenCalledWith('desc');
    expect(zone.updateOrganizerContact).toHaveBeenCalledWith('c@e.com');
    expect(zone.updateTreeSpecies).toHaveBeenCalledWith('pine');
    expect(mockSave).toHaveBeenCalledWith(zone);
  });

  it('handles partial update with some undefined fields', async () => {
    const zone = {
      id: 'z-1',
      name: 'X',
      rename: vi.fn(),
      updateType: vi.fn(),
      reposition: vi.fn(),
      updateTargetCount: vi.fn(),
      updateProgress: vi.fn(),
      changeStatus: vi.fn(),
      updateDescription: vi.fn(),
      updateOrganizerContact: vi.fn(),
      updateTreeSpecies: vi.fn(),
      coordinates: { lat: 1, lng: 2 },
    };
    mockFindById.mockResolvedValue(zone);

    // only name and targetCount set — others should be undefined (no calls)
    await updateHandler.execute({
      id: 'z-1',
      name: 'Renamed',
      targetCount: 200,
    } as any);

    expect(zone.rename).toHaveBeenCalledWith('Renamed');
    expect(zone.updateTargetCount).toHaveBeenCalledWith(200);
    expect(zone.updateType).not.toHaveBeenCalled();
    expect(zone.reposition).not.toHaveBeenCalled();
    expect(zone.updateProgress).not.toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
  });

  it('throws NotFoundException when zone missing', async () => {
    mockFindById.mockResolvedValue(null);
    await expect(
      updateHandler.execute({ id: 'missing' } as any),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('DeleteZoneHandler', () => {
  it('removes zone when found', async () => {
    mockFindById.mockResolvedValue({ id: 'z-1' });
    await deleteHandler.execute({ id: 'z-1' } as any);
    expect(mockRemove).toHaveBeenCalledWith('z-1');
  });

  it('throws NotFoundException when zone missing', async () => {
    mockFindById.mockResolvedValue(null);
    await expect(
      deleteHandler.execute({ id: 'missing' } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
