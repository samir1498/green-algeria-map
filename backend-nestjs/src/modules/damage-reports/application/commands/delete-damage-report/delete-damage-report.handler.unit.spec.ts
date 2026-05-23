import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import {
  DamageReport,
  type DamageReportProps,
} from '../../../domain/damage-report';
import { DamageReportRepository } from '../../../infrastructure/damage-report.repository';
import { DeleteDamageReportCommand } from './delete-damage-report.command';
import { DeleteDamageReportHandler } from './delete-damage-report.handler';

function makeRepository() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByZoneId: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };
}

function makeReport(overrides: Partial<DamageReportProps> = {}) {
  return DamageReport.create({
    zoneId: 'zone-1',
    type: 'fire',
    severity: 'high',
    lat: 36.75,
    lng: 3.06,
    description: 'Fire damage near irrigation line',
    reportedBy: 'volunteer@example.com',
    ...overrides,
  });
}

describe('DeleteDamageReportHandler', () => {
  it('deletes a report when it exists', async () => {
    const repository = makeRepository();
    const report = makeReport();
    repository.findById.mockResolvedValue(report);

    const handler = new DeleteDamageReportHandler(
      repository as unknown as DamageReportRepository,
    );

    await expect(
      handler.execute(new DeleteDamageReportCommand(report.id)),
    ).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(report.id);
  });

  it('throws when deleting a missing report', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);

    const handler = new DeleteDamageReportHandler(
      repository as unknown as DamageReportRepository,
    );

    await expect(
      handler.execute(new DeleteDamageReportCommand('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
