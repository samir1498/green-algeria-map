package com.greenalgeria.zone.api;

import com.greenalgeria.shared.cqrs.CommandBus;
import com.greenalgeria.shared.cqrs.QueryBus;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.application.command.*;
import com.greenalgeria.zone.application.query.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/zones")
@Tag(name = "Zones")
public class ZoneController {

    private final CommandBus commandBus;
    private final QueryBus queryBus;

    public ZoneController(CommandBus commandBus, QueryBus queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public ResponseEntity<List<ZoneResponse>> getAll() {
        return ResponseEntity.ok(queryBus.execute(new GetAllZonesQuery()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ZoneResponse> getById(@PathVariable UUID id) {
        return queryBus.execute(new GetZoneByIdQuery(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ZoneResponse> create(@Valid @RequestBody CreateZoneRequest request) {
        var created = commandBus.execute(new CreateZoneCommand(request));
        return ResponseEntity.created(URI.create("/api/zones/" + created.id())).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ZoneResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateZoneRequest request) {
        return ResponseEntity.ok(commandBus.execute(new UpdateZoneCommand(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        commandBus.execute(new DeleteZoneCommand(id));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/volunteer")
    public ResponseEntity<Void> registerVolunteer(@PathVariable UUID id) {
        commandBus.execute(new RegisterVolunteerCommand(id));
        return ResponseEntity.noContent().build();
    }
}
