package com.greenalgeria.zone.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.greenalgeria.zone.domain.Zone;
import com.greenalgeria.zone.domain.ZoneRepository;
import com.greenalgeria.zone.domain.ZoneStatus;
import com.greenalgeria.zone.domain.ZoneType;
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
class ZoneServiceTest {

    @Mock
    ZoneRepository zoneRepository;

    @InjectMocks
    ZoneService zoneService;

    @Test
    void create() {
        var request =
                new CreateZoneRequest("Test Zone", ZoneType.planting, null, 36.5, 3.0, null, null, "desc", null, null);
        var saved = new Zone("Test Zone", ZoneType.planting, 36.5, 3.0);
        saved.setDescription("desc");
        when(zoneRepository.save(any())).thenReturn(saved);

        var result = zoneService.create(request);

        assertThat(result.name()).isEqualTo("Test Zone");
        assertThat(result.type()).isEqualTo(ZoneType.planting);
        assertThat(result.description()).isEqualTo("desc");
        assertThat(result.status()).isEqualTo(ZoneStatus.planned);
        verify(zoneRepository).save(any());
    }

    @Test
    void update() {
        var id = UUID.randomUUID();
        var existing = new Zone("Old", ZoneType.trash, 1.0, 2.0);
        var request =
                new UpdateZoneRequest("Updated", null, ZoneStatus.in_progress, null, null, 10, 5, null, null, null);
        when(zoneRepository.findById(id)).thenReturn(Optional.of(existing));
        when(zoneRepository.save(existing)).thenReturn(existing);

        var result = zoneService.update(id, request);

        assertThat(result.name()).isEqualTo("Updated");
        assertThat(result.status()).isEqualTo(ZoneStatus.in_progress);
        assertThat(result.targetCount()).isEqualTo(10);
        assertThat(result.currentCount()).isEqualTo(5);
        assertThat(result.type()).isEqualTo(ZoneType.trash);
    }

    @Test
    void update_notFound() {
        var id = UUID.randomUUID();
        when(zoneRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> zoneService.update(
                        id, new UpdateZoneRequest(null, null, null, null, null, null, null, null, null, null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void delete() {
        var id = UUID.randomUUID();
        when(zoneRepository.existsById(id)).thenReturn(true);

        zoneService.delete(id);

        verify(zoneRepository).deleteById(id);
    }

    @Test
    void delete_notFound() {
        var id = UUID.randomUUID();
        when(zoneRepository.existsById(id)).thenReturn(false);

        assertThatThrownBy(() -> zoneService.delete(id))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void registerVolunteer() {
        var id = UUID.randomUUID();
        var zone = new Zone("Test", ZoneType.planting, 1.0, 2.0);
        when(zoneRepository.findById(id)).thenReturn(Optional.of(zone));

        zoneService.registerVolunteer(id);

        assertThat(zone.getVolunteerCount()).isEqualTo(1);
        verify(zoneRepository).save(zone);
    }

    @Test
    void registerVolunteer_notFound() {
        var id = UUID.randomUUID();
        when(zoneRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> zoneService.registerVolunteer(id))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }
}
