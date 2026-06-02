import { EventBus } from '@nestjs/cqrs';
import { vi } from 'vitest';
import { DamageReport } from '../../domain/damage-report';
import { DamageReportRepository } from '../../infrastructure/damage-report.repository';
import { CreateDamageReportCommand } from './create-damage-report.command';
import { CreateDamageReportHandler } from './create-damage-report.handler';

function makeRepository() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByZoneId: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };
}

describe('CreateDamageReportHandler', () => {
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
});
