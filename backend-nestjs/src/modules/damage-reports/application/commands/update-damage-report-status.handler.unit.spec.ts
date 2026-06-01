import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import {
  DamageReport,
  type DamageReportProps,
} from '../../domain/damage-report';
import { DamageReportRepository } from '../../infrastructure/damage-report.repository';
import { UpdateDamageReportStatusCommand } from './update-damage-report-status.command';
import { UpdateDamageReportStatusHandler } from './update-damage-report-status.handler';

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

describe('UpdateDamageReportStatusHandler', () => {
  it('updates damage report status when the report exists', async () => {
    const repository = makeRepository();
    const existing = makeReport();
    repository.findById.mockResolvedValue(existing);
    repository.save.mockImplementation(async (report: DamageReport) => report);

    const handler = new UpdateDamageReportStatusHandler(
      repository as unknown as DamageReportRepository,
    );
    const command = new UpdateDamageReportStatusCommand(
      existing.id,
      'verified',
    );

    const result = await handler.execute(command);

    expect(repository.findById).toHaveBeenCalledWith(existing.id);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('verified');
  });

  it('throws when updating status for a missing report', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);

    const handler = new UpdateDamageReportStatusHandler(
      repository as unknown as DamageReportRepository,
    );

    await expect(
      handler.execute(
        new UpdateDamageReportStatusCommand('missing', 'verified'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
