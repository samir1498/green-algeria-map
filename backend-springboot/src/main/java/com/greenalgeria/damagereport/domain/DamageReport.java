package com.greenalgeria.damagereport.domain;

import jakarta.persistence.*;
import com.greenalgeria.damagereport.domain.DamageReportErrors;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "damage_reports")
public class DamageReport {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID zoneId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DamageReportType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DamageReportSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DamageReportStatus status = DamageReportStatus.reported;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String reportedBy;

    @Column(nullable = false)
    private OffsetDateTime reportedAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected DamageReport() {}

    public DamageReport(
            UUID zoneId,
            DamageReportType type,
            DamageReportSeverity severity,
            Double lat,
            Double lng,
            String description,
            String reportedBy) {
        if (lat == null || lat < -90 || lat > 90) {
            throw new DamageReportErrors.InvalidDamageReportSeverityError("latitude must be between -90 and 90");
        }
        if (lng == null || lng < -180 || lng > 180) {
            throw new DamageReportErrors.InvalidDamageReportSeverityError("longitude must be between -180 and 180");
        }
        this.id = UUID.randomUUID();
        this.zoneId = zoneId;
        this.type = type;
        this.severity = severity;
        this.lat = lat;
        this.lng = lng;
        this.description = description;
        this.reportedBy = reportedBy;
    }

    @PrePersist
    protected void onCreate() {
        reportedAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public void setStatus(DamageReportStatus status) {
        this.status = status;
    }

    public void verify() {
        if (this.status == DamageReportStatus.resolved) {
            throw new DamageReportErrors.InvalidStatusTransitionError(this.status.name(), "verified");
        }
        this.status = DamageReportStatus.verified;
    }

    public void resolve() {
        if (this.status != DamageReportStatus.verified) {
            throw new DamageReportErrors.InvalidStatusTransitionError(this.status.name(), "resolved");
        }
        this.status = DamageReportStatus.resolved;
    }

    public UUID getId() {
        return id;
    }

    public UUID getZoneId() {
        return zoneId;
    }

    public DamageReportType getType() {
        return type;
    }

    public DamageReportSeverity getSeverity() {
        return severity;
    }

    public DamageReportStatus getStatus() {
        return status;
    }

    public Double getLat() {
        return lat;
    }

    public Double getLng() {
        return lng;
    }

    public String getDescription() {
        return description;
    }

    public String getReportedBy() {
        return reportedBy;
    }

    public OffsetDateTime getReportedAt() {
        return reportedAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
