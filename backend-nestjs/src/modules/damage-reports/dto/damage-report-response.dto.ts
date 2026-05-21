import { DamageReport } from '../domain/damage-report';

export class DamageReportResponseDto {
  id: string;
  zoneId: string;
  type: string;
  severity: string;
  status: string;
  lat: number;
  lng: number;
  description: string;
  reportedBy: string;
  reportedAt: Date;
  updatedAt: Date;

  static fromDomain(report: DamageReport): DamageReportResponseDto {
    const dto = new DamageReportResponseDto();
    dto.id = report.id;
    dto.zoneId = report.zoneId;
    dto.type = report.type;
    dto.severity = report.severity;
    dto.status = report.status;
    dto.lat = report.lat;
    dto.lng = report.lng;
    dto.description = report.description;
    dto.reportedBy = report.reportedBy;
    dto.reportedAt = report.reportedAt;
    dto.updatedAt = report.updatedAt;
    return dto;
  }
}
