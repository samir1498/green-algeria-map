package com.greenalgeria.zone.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.greenalgeria.shared.IntegrationTest;
import com.greenalgeria.shared.cqrs.CommandBus;
import com.greenalgeria.shared.cqrs.QueryBus;
import com.greenalgeria.zone.application.command.*;
import com.greenalgeria.zone.application.query.*;
import com.greenalgeria.zone.domain.ZoneStatus;
import com.greenalgeria.zone.domain.ZoneType;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Transactional
class ZoneServiceTest extends IntegrationTest {

    @Autowired
    CommandBus commandBus;

    @Autowired
    QueryBus queryBus;

    @Test
    void create() {
        var request =
                new CreateZoneRequest("Test Zone", ZoneType.planting, null, 36.5, 3.0, null, null, "desc", null, null);

        var result = commandBus.execute(new CreateZoneCommand(request));

        assertThat(result.name()).isEqualTo("Test Zone");
        assertThat(result.type()).isEqualTo(ZoneType.planting);
        assertThat(result.description()).isEqualTo("desc");
        assertThat(result.status()).isEqualTo(ZoneStatus.planned);
    }

    @Test
    void update() {
        var created = commandBus.execute(new CreateZoneCommand(
                new CreateZoneRequest("Old", ZoneType.trash, null, 1.0, 2.0, null, null, null, null, null)));
        var request =
                new UpdateZoneRequest("Updated", null, ZoneStatus.in_progress, null, null, 10, 5, null, null, null);

        var result = commandBus.execute(new UpdateZoneCommand(created.id(), request));

        assertThat(result.name()).isEqualTo("Updated");
        assertThat(result.status()).isEqualTo(ZoneStatus.in_progress);
        assertThat(result.targetCount()).isEqualTo(10);
        assertThat(result.currentCount()).isEqualTo(5);
        assertThat(result.type()).isEqualTo(ZoneType.trash);
    }

    @Test
    void update_notFound() {
        var id = UUID.randomUUID();

        assertThatThrownBy(() -> commandBus.execute(new UpdateZoneCommand(
                        id, new UpdateZoneRequest(null, null, null, null, null, null, null, null, null, null))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void delete() {
        var created = commandBus.execute(new CreateZoneCommand(new CreateZoneRequest(
                "To Delete", ZoneType.planting, null, 36.5, 3.0, null, null, "desc", null, null)));

        commandBus.execute(new DeleteZoneCommand(created.id()));
    }

    @Test
    void delete_notFound() {
        var id = UUID.randomUUID();

        assertThatThrownBy(() -> commandBus.execute(new DeleteZoneCommand(id)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void registerVolunteer() {
        var created = commandBus.execute(new CreateZoneCommand(new CreateZoneRequest(
                "Volunteer Zone", ZoneType.planting, null, 1.0, 2.0, null, null, null, null, null)));

        commandBus.execute(new RegisterVolunteerCommand(created.id()));

        var result = queryBus.execute(new GetZoneByIdQuery(created.id())).orElseThrow();
        assertThat(result.volunteerCount()).isEqualTo(1);
    }

    @Test
    void registerVolunteer_notFound() {
        var id = UUID.randomUUID();

        assertThatThrownBy(() -> commandBus.execute(new RegisterVolunteerCommand(id)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }
}
