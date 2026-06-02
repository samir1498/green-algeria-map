import { vi } from 'vitest';
import {
  DamageReport,
  type DamageReportProps,
} from '../../domain/damage-report';
import { DamageReportRepository } from '../../infrastructure/damage-report.repository';
import { GetAllDamageReportsQuery } from './get-all-damage-reports.query';
import { GetAllDamageReportsHandler } from './get-all-damage-reports.handler';

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

describe('GetAllDamageReportsHandler', () => {
  it('returns all reports or filters by zone id', async () => {
    const repository = makeRepository();
    const allReports = [makeReport(), makeReport({ zoneId: 'zone-2' })];
    const zoneReports = [makeReport()];
    repository.findAll.mockResolvedValue(allReports);
    repository.findByZoneId.mockResolvedValue(zoneReports);

    const handler = new GetAllDamageReportsHandler(
      repository as unknown as DamageReportRepository,
    );

    await expect(
      handler.execute(new GetAllDamageReportsQuery()),
    ).resolves.toEqual(allReports);
    await expect(
      handler.execute(new GetAllDamageReportsQuery('zone-1')),
    ).resolves.toEqual(zoneReports);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findByZoneId).toHaveBeenCalledWith('zone-1');
  });
});
