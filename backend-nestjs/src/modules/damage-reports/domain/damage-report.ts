import { BadRequestException } from '@nestjs/common';
import {
  DAMAGE_REPORT_TYPES,
  DAMAGE_REPORT_SEVERITIES,
  DAMAGE_REPORT_STATUSES,
  type DamageReportType,
  type DamageReportSeverity,
  type DamageReportStatus,
} from './damage-report.types';

export interface DamageReportProps {
  id?: string;
  zoneId: string;
  type: DamageReportType;
  severity: DamageReportSeverity;
  status?: DamageReportStatus;
  lat: number;
  lng: number;
  description: string;
  reportedBy: string;
  reportedAt?: Date;
  updatedAt?: Date;
}

export class DamageReport {
  readonly id: string;
  readonly zoneId: string;
  readonly type: DamageReportType;
  readonly severity: DamageReportSeverity;
  readonly status: DamageReportStatus;
  readonly lat: number;
  readonly lng: number;
  readonly description: string;
  readonly reportedBy: string;
  readonly reportedAt: Date;
  readonly updatedAt: Date;

  private constructor(props: {
    id: string;
    zoneId: string;
    type: DamageReportType;
    severity: DamageReportSeverity;
    status: DamageReportStatus;
    lat: number;
    lng: number;
    description: string;
    reportedBy: string;
    reportedAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.zoneId = props.zoneId;
    this.type = props.type;
    this.severity = props.severity;
    this.status = props.status;
    this.lat = props.lat;
    this.lng = props.lng;
    this.description = props.description;
    this.reportedBy = props.reportedBy;
    this.reportedAt = props.reportedAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: DamageReportProps): DamageReport {
    if (!DAMAGE_REPORT_TYPES.includes(props.type)) {
      throw new BadRequestException(
        `Invalid damage report type: ${props.type}`,
      );
    }
    if (!DAMAGE_REPORT_SEVERITIES.includes(props.severity)) {
      throw new BadRequestException(
        `Invalid damage report severity: ${props.severity}`,
      );
    }
    if (
      props.status !== undefined &&
      !DAMAGE_REPORT_STATUSES.includes(props.status)
    ) {
      throw new BadRequestException(
        `Invalid damage report status: ${props.status}`,
      );
    }
    const now = new Date();
    return new DamageReport({
      id: props.id ?? crypto.randomUUID(),
      zoneId: props.zoneId,
      type: props.type,
      severity: props.severity,
      status: props.status ?? 'reported',
      lat: props.lat,
      lng: props.lng,
      description: props.description,
      reportedBy: props.reportedBy,
      reportedAt: props.reportedAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  canChangeStatusTo(newStatus: DamageReportStatus): boolean {
    const transitions: Record<DamageReportStatus, DamageReportStatus[]> = {
      reported: ['verified'],
      verified: ['resolved'],
      resolved: [],
    };
    return transitions[this.status].includes(newStatus);
  }

  changeStatus(newStatus: DamageReportStatus): DamageReport {
    if (!this.canChangeStatusTo(newStatus)) {
      throw new BadRequestException(
        `Cannot change status from '${this.status}' to '${newStatus}'`,
      );
    }
    return DamageReport.create({
      id: this.id,
      zoneId: this.zoneId,
      type: this.type,
      severity: this.severity,
      status: newStatus,
      lat: this.lat,
      lng: this.lng,
      description: this.description,
      reportedBy: this.reportedBy,
      reportedAt: this.reportedAt,
      updatedAt: new Date(),
    });
  }
}
