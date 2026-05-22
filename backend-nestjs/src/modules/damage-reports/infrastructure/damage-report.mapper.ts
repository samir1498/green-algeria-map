import { DamageReport } from '../domain/damage-report';
import { DamageReportOrmEntity } from './damage-report.orm-entity';
import {
  DAMAGE_REPORT_TYPES,
  DAMAGE_REPORT_SEVERITIES,
  DAMAGE_REPORT_STATUSES,
  type DamageReportType,
  type DamageReportSeverity,
  type DamageReportStatus,
} from '../domain/damage-report.types';
import {
  InvalidDamageReportTypeError,
  InvalidDamageReportSeverityError,
  InvalidDamageReportStatusError,
} from '../../../lib/domain/damage-report-errors';

export class DamageReportMapper {
  static toDomain(orm: DamageReportOrmEntity): DamageReport {
    if (!DAMAGE_REPORT_TYPES.includes(orm.type as DamageReportType)) {
      throw new InvalidDamageReportTypeError(orm.type);
    }
    if (
      !DAMAGE_REPORT_SEVERITIES.includes(orm.severity as DamageReportSeverity)
    ) {
      throw new InvalidDamageReportSeverityError(orm.severity);
    }
    if (!DAMAGE_REPORT_STATUSES.includes(orm.status as DamageReportStatus)) {
      throw new InvalidDamageReportStatusError(orm.status);
    }

    return DamageReport.create({
      id: orm.id,
      zoneId: orm.zoneId,
      type: orm.type as DamageReportType,
      severity: orm.severity as DamageReportSeverity,
      status: orm.status as DamageReportStatus,
      lat: orm.lat,
      lng: orm.lng,
      description: orm.description,
      reportedBy: orm.reportedBy,
      reportedAt: orm.reportedAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrmEntity(domain: DamageReport): DamageReportOrmEntity {
    const orm = new DamageReportOrmEntity();
    orm.id = domain.id;
    orm.zoneId = domain.zoneId;
    orm.type = domain.type;
    orm.severity = domain.severity;
    orm.status = domain.status;
    orm.lat = domain.lat;
    orm.lng = domain.lng;
    orm.description = domain.description;
    orm.reportedBy = domain.reportedBy;
    orm.reportedAt = domain.reportedAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
