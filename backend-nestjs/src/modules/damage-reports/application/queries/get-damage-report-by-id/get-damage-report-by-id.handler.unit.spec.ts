import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import {
  DamageReport,
  type DamageReportProps,
} from '../../../domain/damage-report';
import { DamageReportRepository } from '../../../infrastructure/damage-report.repository';
import { GetDamageReportByIdQuery } from './get-damage-report-by-id.query';
import { GetDamageReportByIdHandler } from './get-damage-report-by-id.handler';

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

describe('GetDamageReportByIdHandler', () => {
  it('returns a report by id and throws when it is missing', async () => {
    const repository = makeRepository();
    const report = makeReport();
    repository.findById
      .mockResolvedValueOnce(report)
      .mockResolvedValueOnce(null);

    const handler = new GetDamageReportByIdHandler(
      repository as unknown as DamageReportRepository,
    );

    await expect(
      handler.execute(new GetDamageReportByIdQuery(report.id)),
    ).resolves.toBe(report);
    await expect(
      handler.execute(new GetDamageReportByIdQuery('missing')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
