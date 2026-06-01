package com.greenalgeria.damagereport.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.greenalgeria.damagereport.domain.DamageReportSeverity;
import com.greenalgeria.damagereport.domain.DamageReportStatus;
import com.greenalgeria.damagereport.domain.DamageReportType;
import com.greenalgeria.shared.IntegrationTest;
import com.greenalgeria.zone.application.CreateZoneRequest;
import com.greenalgeria.zone.application.ZoneService;
import com.greenalgeria.zone.domain.ZoneType;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Transactional
class DamageReportServiceTest extends IntegrationTest {

    @Autowired
    DamageReportService damageReportService;

    @Autowired
    ZoneService zoneService;

    private UUID createZone() {
        return zoneService
                .create(new CreateZoneRequest(
                        "Test Zone", ZoneType.planting, null, 36.5, 3.0, null, null, null, null, null))
                .id();
    }

    @Test
    void create() {
        var zoneId = createZone();
        var request = new CreateDamageReportRequest(
                zoneId, DamageReportType.vandalism, DamageReportSeverity.high, 36.5, 3.0, "Broken fence", "Samir");

        var result = damageReportService.create(request);

        assertThat(result.zoneId()).isEqualTo(zoneId);
        assertThat(result.type()).isEqualTo(DamageReportType.vandalism);
        assertThat(result.severity()).isEqualTo(DamageReportSeverity.high);
        assertThat(result.description()).isEqualTo("Broken fence");
        assertThat(result.status()).isEqualTo(DamageReportStatus.reported);
    }

    @Test
    void updateStatus() {
        var zoneId = createZone();
        var created = damageReportService.create(new CreateDamageReportRequest(
                zoneId, DamageReportType.fire, DamageReportSeverity.critical, 1.0, 2.0, "Fire", "Samir"));

        var result = damageReportService.updateStatus(created.id(), DamageReportStatus.verified);

        assertThat(result.status()).isEqualTo(DamageReportStatus.verified);
    }

    @Test
    void updateStatus_notFound() {
        var id = UUID.randomUUID();

        assertThatThrownBy(() -> damageReportService.updateStatus(id, DamageReportStatus.resolved))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void delete() {
        var zoneId = createZone();
        var created = damageReportService.create(new CreateDamageReportRequest(
                zoneId, DamageReportType.fire, DamageReportSeverity.high, 1.0, 2.0, "Fire", "Samir"));

        damageReportService.delete(created.id());
    }

    @Test
    void delete_notFound() {
        var id = UUID.randomUUID();

        assertThatThrownBy(() -> damageReportService.delete(id))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }
}
