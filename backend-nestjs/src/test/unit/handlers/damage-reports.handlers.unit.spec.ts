import { EventBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import {
  DamageReport,
  type DamageReportProps,
} from '../../../modules/damage-reports/domain/damage-report';
import { DamageReportRepository } from '../../../modules/damage-reports/infrastructure/damage-report.repository';
import { CreateDamageReportCommand } from '../../../modules/damage-reports/application/commands/create-damage-report/create-damage-report.command';
import { CreateDamageReportHandler } from '../../../modules/damage-reports/application/commands/create-damage-report/create-damage-report.handler';
import { UpdateDamageReportStatusCommand } from '../../../modules/damage-reports/application/commands/update-damage-report-status/update-damage-report-status.command';
import { UpdateDamageReportStatusHandler } from '../../../modules/damage-reports/application/commands/update-damage-report-status/update-damage-report-status.handler';
import { DeleteDamageReportCommand } from '../../../modules/damage-reports/application/commands/delete-damage-report/delete-damage-report.command';
import { DeleteDamageReportHandler } from '../../../modules/damage-reports/application/commands/delete-damage-report/delete-damage-report.handler';
import { GetAllDamageReportsQuery } from '../../../modules/damage-reports/application/queries/get-all-damage-reports/get-all-damage-reports.query';
import { GetAllDamageReportsHandler } from '../../../modules/damage-reports/application/queries/get-all-damage-reports/get-all-damage-reports.handler';
import { GetDamageReportByIdQuery } from '../../../modules/damage-reports/application/queries/get-damage-report-by-id/get-damage-report-by-id.query';
import { GetDamageReportByIdHandler } from '../../../modules/damage-reports/application/queries/get-damage-report-by-id/get-damage-report-by-id.handler';

describe('Damage report handlers', () => {
  function makeRepository(): {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByZoneId: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  } {
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

  it('creates a damage report and publishes an event', async () => {
    const repository = makeRepository();
    const eventBus = { publish: vi.fn() };
    let savedReport: DamageReport | undefined;

    repository.save.mockImplementation(async (report: DamageReport) => {
      savedReport = report;
      return report;
    });

    const handler = new CreateDamageReportHandler(
      repository as unknown as DamageReportRepository,
      eventBus as unknown as EventBus,
    );
    const command = new CreateDamageReportCommand(
      'zone-1',
      'fire',
      'high',
      36.75,
      3.06,
      'Fire damage near irrigation line',
      'volunteer@example.com',
    );

    const result = await handler.execute(command);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(savedReport?.zoneId).toBe('zone-1');
    expect(savedReport?.type).toBe('fire');
    expect(savedReport?.severity).toBe('high');
    expect(savedReport?.description).toBe('Fire damage near irrigation line');
    expect(savedReport?.reportedBy).toBe('volunteer@example.com');
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(result).toBe(savedReport);
  });

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
