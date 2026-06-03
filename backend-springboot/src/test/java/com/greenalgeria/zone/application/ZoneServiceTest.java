package com.greenalgeria.zone.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.greenalgeria.shared.IntegrationTest;
import com.greenalgeria.shared.exception.NotFoundException;
import com.greenalgeria.zone.application.command.*;
import com.greenalgeria.zone.application.query.*;
import com.greenalgeria.zone.domain.ZoneStatus;
import com.greenalgeria.zone.domain.ZoneType;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class ZoneServiceTest extends IntegrationTest {

    @Autowired
    CreateZoneHandler createZoneHandler;

    @Autowired
    UpdateZoneHandler updateZoneHandler;

    @Autowired
    DeleteZoneHandler deleteZoneHandler;

    @Autowired
    RegisterVolunteerHandler registerVolunteerHandler;

    @Autowired
    GetZoneByIdHandler getZoneByIdHandler;

    @Test
    void create() {
        var request =
                new CreateZoneRequest("Test Zone", ZoneType.planting, null, 36.5, 3.0, null, null, "desc", null, null);

        var result = createZoneHandler.handle(new CreateZoneCommand(request));

        assertThat(result.name()).isEqualTo("Test Zone");
        assertThat(result.type()).isEqualTo(ZoneType.planting);
        assertThat(result.description()).isEqualTo("desc");
        assertThat(result.status()).isEqualTo(ZoneStatus.planned);
    }

    @Test
    void update() {
        var created = createZoneHandler.handle(new CreateZoneCommand(
                new CreateZoneRequest("Old", ZoneType.trash, null, 1.0, 2.0, null, null, null, null, null)));
        var request =
                new UpdateZoneRequest("Updated", null, ZoneStatus.in_progress, null, null, 10, 5, null, null, null);

        var result = updateZoneHandler.handle(new UpdateZoneCommand(created.id(), request));

        assertThat(result.name()).isEqualTo("Updated");
        assertThat(result.status()).isEqualTo(ZoneStatus.in_progress);
        assertThat(result.targetCount()).isEqualTo(10);
        assertThat(result.currentCount()).isEqualTo(5);
        assertThat(result.type()).isEqualTo(ZoneType.trash);
    }

    @Test
    void update_notFound() {
        var id = UUID.randomUUID();

        assertThatThrownBy(() -> updateZoneHandler.handle(new UpdateZoneCommand(
                        id, new UpdateZoneRequest(null, null, null, null, null, null, null, null, null, null))))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Zone not found");
    }

    @Test
    void delete() {
        var created = createZoneHandler.handle(new CreateZoneCommand(new CreateZoneRequest(
                "To Delete", ZoneType.planting, null, 36.5, 3.0, null, null, "desc", null, null)));

        deleteZoneHandler.handle(new DeleteZoneCommand(created.id()));
    }

    @Test
    void delete_notFound() {
        var id = UUID.randomUUID();

        assertThatThrownBy(() -> deleteZoneHandler.handle(new DeleteZoneCommand(id)))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Zone not found");
    }

    @Test
    void registerVolunteer() {
        var created = createZoneHandler.handle(new CreateZoneCommand(new CreateZoneRequest(
                "Volunteer Zone", ZoneType.planting, null, 1.0, 2.0, null, null, null, null, null)));

        registerVolunteerHandler.handle(new RegisterVolunteerCommand(created.id()));

        var result =
                getZoneByIdHandler.handle(new GetZoneByIdQuery(created.id())).orElseThrow();
        assertThat(result.volunteerCount()).isEqualTo(1);
    }

    @Test
    void registerVolunteer_notFound() {
        var id = UUID.randomUUID();

        assertThatThrownBy(() -> registerVolunteerHandler.handle(new RegisterVolunteerCommand(id)))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Zone not found");
    }
}
