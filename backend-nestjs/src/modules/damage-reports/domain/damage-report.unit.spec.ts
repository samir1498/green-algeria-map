import { DamageReport, type DamageReportProps } from './damage-report';
import {
  InvalidDamageReportTypeError,
  InvalidDamageReportSeverityError,
  InvalidStatusTransitionError,
} from './damage-report-errors';

describe('DamageReport', () => {
  function makeReport(
    overrides: Partial<Parameters<typeof DamageReport.create>[0]> = {},
  ) {
    return DamageReport.create({
      zoneId: 'zone-1',
      type: 'fire',
      severity: 'medium',
      lat: 36.75,
      lng: 3.05,
      description: 'Test damage report',
      reportedBy: 'volunteer-001',
      ...overrides,
    });
  }

  describe('create', () => {
    it('creates report with all fields', () => {
      const report = makeReport();

      expect(report.zoneId).toBe('zone-1');
      expect(report.type).toBe('fire');
      expect(report.severity).toBe('medium');
      expect(report.status).toBe('reported');
      expect(report.description).toBe('Test damage report');
      expect(report.reportedBy).toBe('volunteer-001');
    });

    it('accepts explicit id', () => {
      const report = makeReport({ id: 'test-uuid' });

      expect(report.id).toBe('test-uuid');
    });

    it('defaults status to reported', () => {
      const report = makeReport();

      expect(report.status).toBe('reported');
    });

    it('rejects invalid type', () => {
      const invalidType: DamageReportProps['type'] =
        'invalid' as DamageReportProps['type'];
      expect(() =>
        DamageReport.create({
          zoneId: 'zone-1',
          type: invalidType,
          severity: 'medium',
          lat: 36.75,
          lng: 3.05,
          description: 'Test',
          reportedBy: 'volunteer-001',
        }),
      ).toThrow(InvalidDamageReportTypeError);
    });

    it('rejects invalid severity', () => {
      const invalidSeverity: DamageReportProps['severity'] =
        'invalid' as DamageReportProps['severity'];
      expect(() =>
        DamageReport.create({
          zoneId: 'zone-1',
          type: 'fire',
          severity: invalidSeverity,
          lat: 36.75,
          lng: 3.05,
          description: 'Test',
          reportedBy: 'volunteer-001',
        }),
      ).toThrow(InvalidDamageReportSeverityError);
    });
  });

  describe('canChangeStatusTo', () => {
    it('allows reported to verified', () => {
      const report = makeReport({ status: 'reported' });

      expect(report.canChangeStatusTo('verified')).toBe(true);
    });

    it('allows verified to resolved', () => {
      const report = makeReport({ status: 'verified' });

      expect(report.canChangeStatusTo('resolved')).toBe(true);
    });

    it('does not allow reported to resolved', () => {
      const report = makeReport({ status: 'reported' });

      expect(report.canChangeStatusTo('resolved')).toBe(false);
    });

    it('does not allow verified to reported', () => {
      const report = makeReport({ status: 'verified' });

      expect(report.canChangeStatusTo('reported')).toBe(false);
    });

    it('does not allow resolved to any status', () => {
      const report = makeReport({ status: 'resolved' });

      expect(report.canChangeStatusTo('reported')).toBe(false);
      expect(report.canChangeStatusTo('verified')).toBe(false);
    });
  });

  describe('changeStatus', () => {
    it('changes status from reported to verified', () => {
      const report = makeReport({ status: 'reported' });
      const updated = report.changeStatus('verified');

      expect(updated.status).toBe('verified');
      expect(updated.id).toBe(report.id);
    });

    it('changes status from verified to resolved', () => {
      const report = makeReport({ status: 'verified' });
      const updated = report.changeStatus('resolved');

      expect(updated.status).toBe('resolved');
    });

    it('throws on invalid transition', () => {
      const report = makeReport({ status: 'reported' });

      expect(() => report.changeStatus('resolved')).toThrow(
        InvalidStatusTransitionError,
      );
    });

    it('throws on backward transition', () => {
      const report = makeReport({ status: 'verified' });

      expect(() => report.changeStatus('reported')).toThrow(
        InvalidStatusTransitionError,
      );
    });

    it('throws on transition from resolved', () => {
      const report = makeReport({ status: 'resolved' });

      expect(() => report.changeStatus('verified')).toThrow(
        InvalidStatusTransitionError,
      );
    });

    it('updates updatedAt timestamp', () => {
      const report = makeReport({ status: 'reported' });
      const originalTime = report.updatedAt.getTime();

      const updated = report.changeStatus('verified');

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalTime);
    });
  });
});
