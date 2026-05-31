package com.greenalgeria.damagereport.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.greenalgeria.damagereport.domain.DamageReport;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import com.greenalgeria.damagereport.domain.DamageReportSeverity;
import com.greenalgeria.damagereport.domain.DamageReportStatus;
import com.greenalgeria.damagereport.domain.DamageReportType;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class DamageReportServiceTest {

    @Mock
    DamageReportRepository damageReportRepository;

    @InjectMocks
    DamageReportService damageReportService;

    @Test
    void create() {
        var zoneId = UUID.randomUUID();
        var request = new CreateDamageReportRequest(
                zoneId, DamageReportType.vandalism, DamageReportSeverity.high, 36.5, 3.0, "Broken fence", "Samir");
        var saved = new DamageReport(
                zoneId, DamageReportType.vandalism, DamageReportSeverity.high, 36.5, 3.0, "Broken fence", "Samir");
        when(damageReportRepository.save(any())).thenReturn(saved);

        var result = damageReportService.create(request);

        assertThat(result.zoneId()).isEqualTo(zoneId);
        assertThat(result.type()).isEqualTo(DamageReportType.vandalism);
        assertThat(result.severity()).isEqualTo(DamageReportSeverity.high);
        assertThat(result.description()).isEqualTo("Broken fence");
        assertThat(result.status()).isEqualTo(DamageReportStatus.reported);
        verify(damageReportRepository).save(any());
    }

    @Test
    void updateStatus() {
        var id = UUID.randomUUID();
        var zoneId = UUID.randomUUID();
        var existing = new DamageReport(
                zoneId, DamageReportType.fire, DamageReportSeverity.critical, 1.0, 2.0, "Fire", "Samir");
        when(damageReportRepository.findById(id)).thenReturn(Optional.of(existing));
        when(damageReportRepository.save(existing)).thenReturn(existing);

        var result = damageReportService.updateStatus(id, DamageReportStatus.verified);

        assertThat(result.status()).isEqualTo(DamageReportStatus.verified);
    }

    @Test
    void updateStatus_notFound() {
        var id = UUID.randomUUID();
        when(damageReportRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> damageReportService.updateStatus(id, DamageReportStatus.resolved))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void delete() {
        var id = UUID.randomUUID();
        when(damageReportRepository.existsById(id)).thenReturn(true);

        damageReportService.delete(id);

        verify(damageReportRepository).deleteById(id);
    }

    @Test
    void delete_notFound() {
        var id = UUID.randomUUID();
        when(damageReportRepository.existsById(id)).thenReturn(false);

        assertThatThrownBy(() -> damageReportService.delete(id))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }
}
