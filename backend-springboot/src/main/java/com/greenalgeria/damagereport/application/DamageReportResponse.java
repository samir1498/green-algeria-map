package com.greenalgeria.damagereport.application;

import com.greenalgeria.damagereport.domain.DamageReport;
import com.greenalgeria.damagereport.domain.DamageReportSeverity;
import com.greenalgeria.damagereport.domain.DamageReportStatus;
import com.greenalgeria.damagereport.domain.DamageReportType;
import java.time.OffsetDateTime;
import java.util.UUID;

public record DamageReportResponse(
        UUID id,
        UUID zoneId,
        DamageReportType type,
        DamageReportSeverity severity,
        DamageReportStatus status,
        Double lat,
        Double lng,
        String description,
        String reportedBy,
        OffsetDateTime reportedAt,
        OffsetDateTime updatedAt) {
    public static DamageReportResponse from(DamageReport report) {
        return new DamageReportResponse(
                report.getId(),
                report.getZoneId(),
                report.getType(),
                report.getSeverity(),
                report.getStatus(),
                report.getLat(),
                report.getLng(),
                report.getDescription(),
                report.getReportedBy(),
                report.getReportedAt(),
                report.getUpdatedAt());
    }
}
