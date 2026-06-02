package com.greenalgeria.damagereport.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("unit")
class DamageReportTest {

    private static DamageReport createFireReport() {
        return new DamageReport(
                UUID.randomUUID(),
                DamageReportType.fire,
                DamageReportSeverity.high,
                36.5,
                3.0,
                "Fire near pine trees",
                "test@example.com");
    }

    @Test
    void create() {
        var zoneId = UUID.randomUUID();
        var report = new DamageReport(
                zoneId,
                DamageReportType.disease,
                DamageReportSeverity.medium,
                1.0,
                2.0,
                "Diseased oaks",
                "reporter@example.com");

        assertThat(report.getZoneId()).isEqualTo(zoneId);
        assertThat(report.getType()).isEqualTo(DamageReportType.disease);
        assertThat(report.getSeverity()).isEqualTo(DamageReportSeverity.medium);
        assertThat(report.getLat()).isEqualTo(1.0);
        assertThat(report.getLng()).isEqualTo(2.0);
        assertThat(report.getDescription()).isEqualTo("Diseased oaks");
        assertThat(report.getReportedBy()).isEqualTo("reporter@example.com");
        assertThat(report.getStatus()).isEqualTo(DamageReportStatus.reported);
        assertThat(report.getId()).isNotNull();
    }

    @Test
    void verify_fromReported() {
        var report = createFireReport();

        report.verify();

        assertThat(report.getStatus()).isEqualTo(DamageReportStatus.verified);
    }

    @Test
    void verify_fromResolved() {
        var report = createFireReport();
        report.verify();
        report.resolve();

        assertThatThrownBy(report::verify)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("verify");
    }

    @Test
    void resolve_fromVerified() {
        var report = createFireReport();
        report.verify();

        report.resolve();

        assertThat(report.getStatus()).isEqualTo(DamageReportStatus.resolved);
    }

    @Test
    void resolve_fromReported() {
        var report = createFireReport();

        assertThatThrownBy(report::resolve)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("verified");
    }

    @Test
    void resolve_fromResolved() {
        var report = createFireReport();
        report.verify();
        report.resolve();

        assertThatThrownBy(report::resolve)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("verified");
    }

    @Test
    void setStatus_directly() {
        var report = createFireReport();

        report.setStatus(DamageReportStatus.resolved);

        assertThat(report.getStatus()).isEqualTo(DamageReportStatus.resolved);
    }

    @Test
    void create_allTypes() {
        for (var type : DamageReportType.values()) {
            var report = new DamageReport(
                    UUID.randomUUID(), type, DamageReportSeverity.low, 0.0, 0.0, "Test", "test@example.com");
            assertThat(report.getType()).isEqualTo(type);
        }
    }

    @Test
    void create_allSeverities() {
        for (var severity : DamageReportSeverity.values()) {
            var report = new DamageReport(
                    UUID.randomUUID(), DamageReportType.fire, severity, 0.0, 0.0, "Test", "test@example.com");
            assertThat(report.getSeverity()).isEqualTo(severity);
        }
    }
}
