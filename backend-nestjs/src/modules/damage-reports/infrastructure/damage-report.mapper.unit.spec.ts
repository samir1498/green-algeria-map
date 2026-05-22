import { DamageReportMapper } from './damage-report.mapper';
import { DamageReportOrmEntity } from './damage-report.orm-entity';
import { DamageReport } from '../domain/damage-report';
import {
  InvalidDamageReportTypeError,
  InvalidDamageReportSeverityError,
  InvalidDamageReportStatusError,
} from '../../../lib/domain/damage-report-errors';

describe('DamageReportMapper', () => {
  function makeOrm(
    overrides: Partial<DamageReportOrmEntity> = {},
  ): DamageReportOrmEntity {
    const now = new Date();
    const entity = new DamageReportOrmEntity();
    entity.id = 'test-uuid';
    entity.zoneId = 'zone-1';
    entity.type = 'fire';
    entity.severity = 'medium';
    entity.status = 'reported';
    entity.lat = 36.75;
    entity.lng = 3.05;
    entity.description = 'Test damage';
    entity.reportedBy = 'volunteer-001';
    entity.reportedAt = now;
    entity.updatedAt = now;
    Object.assign(entity, overrides);
    return entity;
  }

  describe('toDomain', () => {
    it('maps valid ORM entity to domain', () => {
      const orm = makeOrm();
      const domain = DamageReportMapper.toDomain(orm);

      expect(domain.id).toBe('test-uuid');
      expect(domain.zoneId).toBe('zone-1');
      expect(domain.type).toBe('fire');
      expect(domain.severity).toBe('medium');
      expect(domain.status).toBe('reported');
      expect(domain.lat).toBe(36.75);
      expect(domain.lng).toBe(3.05);
      expect(domain.description).toBe('Test damage');
      expect(domain.reportedBy).toBe('volunteer-001');
    });

    it('throws on invalid type', () => {
      const orm = makeOrm({ type: 'invalid' });

      expect(() => DamageReportMapper.toDomain(orm)).toThrow(
        InvalidDamageReportTypeError,
      );
    });

    it('throws on invalid severity', () => {
      const orm = makeOrm({ severity: 'invalid' });

      expect(() => DamageReportMapper.toDomain(orm)).toThrow(
        InvalidDamageReportSeverityError,
      );
    });

    it('throws on invalid status', () => {
      const orm = makeOrm({ status: 'invalid' });

      expect(() => DamageReportMapper.toDomain(orm)).toThrow(
        InvalidDamageReportStatusError,
      );
    });
  });

  describe('toOrmEntity', () => {
    it('maps domain to ORM entity', () => {
      const domain = DamageReport.create({
        zoneId: 'zone-1',
        type: 'fire',
        severity: 'medium',
        lat: 36.75,
        lng: 3.05,
        description: 'Test damage',
        reportedBy: 'volunteer-001',
      });

      const orm = DamageReportMapper.toOrmEntity(domain);

      expect(orm.id).toBe(domain.id);
      expect(orm.zoneId).toBe('zone-1');
      expect(orm.type).toBe('fire');
      expect(orm.severity).toBe('medium');
      expect(orm.status).toBe('reported');
      expect(orm.lat).toBe(36.75);
      expect(orm.lng).toBe(3.05);
      expect(orm.description).toBe('Test damage');
      expect(orm.reportedBy).toBe('volunteer-001');
    });
  });
});
